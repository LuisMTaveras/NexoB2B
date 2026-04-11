import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { IntegrationRuntime } from './runtime.service';
import { OrderSyncStatus, SyncResource, SyncDirection } from '@prisma/client';
import { logAction } from '../../lib/audit';

export class OutboundSyncService {
  /**
   * Main entry point for syncing an order to the ERP.
   * Logic: Pre-flight -> Send -> State Update
   */
  static async syncOrder(orderId: string, companyId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: { include: { product: true } } }
    });

    if (!order) throw new Error('Order not found');

    // 1. Get Outbound Mapping for Orders
    const mapping = await prisma.integrationMapping.findFirst({
      where: { 
        integration: { companyId, isActive: true },
        resource: 'ORDERS',
        direction: 'OUTBOUND',
        isActive: true
      },
      include: { integration: true }
    });

    if (!mapping) {
      logger.warn(`No outbound mapping found for Orders in company ${companyId}`);
      return;
    }

    try {
      // 2. Pre-flight Check: Resolve context levels 1, 2 and 3
      const context = IntegrationRuntime.resolveOutboundContext(order, order.customer);
      
      // Perform validation (Pre-flight)
      const missingFields = this.validatePreFlight(context, mapping.extendedFieldsDef as any, mapping.fieldMappings as any);
      
      if (missingFields.length > 0) {
        await this.updateStatus(orderId, 'PENDING_ERP', `Campos obligatorios faltantes: ${missingFields.join(', ')}`);
        return;
      }

      // 3. Transformation
      const payload = IntegrationRuntime.transform(context, mapping.fieldMappings, mapping.transforms, 'OUTBOUND');

      // 4. Send to ERP
      await this.updateStatus(orderId, 'SENDING_TO_ERP');
      
      const response = await IntegrationRuntime.executeRequest(mapping.integration, mapping, payload);

      // 5. Success Handling
      const externalId = mapping.successIdField ? response[mapping.successIdField] : null;

      if (externalId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            externalId: String(externalId),
            syncStatus: 'SYNCED',
            syncedAt: new Date()
          }
        });
        logger.info(`Order ${order.number} synced successfully with ERP ID ${externalId}`);
        // Create an ad-hoc job if one doesn't exist for outbound logging? 
        // Better yet, use the last job or create a special one.
      } else {
        // No ID in response -> PENDING_VERIFICATION (Fingerprint mode)
        await this.updateStatus(orderId, 'PENDING_VERIFICATION', 'Respuesta exitosa pero no se encontró ID externo. Verificando por fingerprint...');
      }

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      await this.updateStatus(orderId, 'SYNC_FAILED', errorMsg);
      logger.error(`Sync failed for order ${order.number}: ${errorMsg}`);
    }
  }

  /**
   * For orders in PENDING_VERIFICATION, searches the ERP for a match by fingerprint.
   */
  static async verifyByFingerprint(orderId: string, companyId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    if (!order) return;

    const mapping = await prisma.integrationMapping.findFirst({
      where: { integration: { companyId }, resource: 'ORDERS', direction: 'INBOUND', isActive: true },
      include: { integration: true }
    });
    if (!mapping) return;

    try {
      // 1. Search ERP for orders from this client on this date
      const erpData = await IntegrationRuntime.executeRequest(mapping.integration, mapping);
      
      // 2. Look for exact match (fingerprint)
      const match = erpData.find((erpOrder: any) => {
        // Basic fingerprint comparison logic
        const erpTotal = parseFloat(erpOrder.total || 0);
        return Math.abs(erpTotal - Number(order.total)) < 0.01 && 
               new Date(erpOrder.date).toISOString().slice(0,10) === order.date.toISOString().slice(0,10);
      });

      if (match) {
        const outboundMapping = await prisma.integrationMapping.findFirst({
          where: { integration: { companyId }, resource: 'ORDERS', direction: 'OUTBOUND' }
        });
        const externalId = get(match, outboundMapping?.successIdField || 'id');
        
        await prisma.order.update({
          where: { id: orderId },
          data: { externalId: String(externalId), syncStatus: 'SYNCED', syncedAt: new Date() }
        });
      }
    } catch (err) {
      logger.error(`Fingerprint verification failed for order ${order.id}`, err);
    }
  }

  private static validatePreFlight(context: any, extendedDef: any, mappings: any): string[] {
    const missing: string[] = [];
    const def = extendedDef || {};

    // Check Extended Fields (Level 3)
    for (const [key, config] of Object.entries(def)) {
      if ((config as any).required && !context.order.extendedFields[key]) {
        missing.push((config as any).label || key);
      }
    }

    // Check Mappings (Level 1 & 2)
    // Here we could add logic to verify if the resolved path in 'context' exists for required fields
    // but typically the ExtendedFieldsDef covers the most dynamic parts.

    return missing;
  }

  private static async logSync(jobId: string, level: 'info' | 'warn' | 'error', message: string, details?: any) {
    await prisma.integrationSyncLog.create({
      data: { jobId, level, message, details }
    });
  }

  private static async updateStatus(orderId: string, status: OrderSyncStatus, errorNote?: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { syncStatus: status }
    });

    if (errorNote) {
      console.log(`[SyncStatus Update] Order ${orderId} -> ${status}: ${errorNote}`);
    }
  }

  /**
   * Worker method to process all pending outbound orders and those needing verification.
   */
  static async processOutboundQueue() {
    // 1. Process Pending/Failed orders (Retries)
    const pendingOrders = await prisma.order.findMany({
      where: { 
        syncStatus: { in: ['SUBMITTED', 'PENDING_ERP', 'SYNC_FAILED'] },
        // Simple logic: less than 3 attempts if we had a counter, 
        // for now we'll just process all of them that haven't succeeded
      },
      include: { customer: true }
    });

    for (const order of pendingOrders) {
      try {
        await this.syncOrder(order.id, order.customer.companyId);
      } catch (err) {
        // Log skip to worker logs
      }
    }

    // 2. Process Verification (Fingerprint)
    const verificationOrders = await prisma.order.findMany({
      where: { syncStatus: 'PENDING_VERIFICATION' },
      include: { customer: true }
    });

    for (const order of verificationOrders) {
      try {
        await this.verifyByFingerprint(order.id, order.customer.companyId);
      } catch (err) {
        // Log skip
      }
    }
  }
}
