import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { IntegrationRuntime } from '../integration/runtime.service';

export class OrdersService {
  /**
   * Obtiene un pedido con sus detalles, aplicando lógica ON_DEMAND si existe un mapping activo.
   */
  static async getById(orderId: string, companyId: string, customerId?: string) {
    const where: any = { id: orderId, companyId };
    if (customerId) where.customerId = customerId;

    const order = await prisma.order.findFirst({
      where,
      include: {
        customer: { select: { name: true, internalCode: true } },
        items: true,
        submittedBy: { select: { firstName: true, lastName: true, email: true } },
        approvedBy: { select: { firstName: true, lastName: true, email: true } }
      } as any
    });

    if (!order) return null;

    // Lógica On-Demand: Si existe un mapping configurado para traer líneas en tiempo real
    const mapping = await prisma.integrationMapping.findFirst({
      where: {
        resource: 'ORDERS',
        direction: 'INBOUND',
        detailFetchOn: 'ON_DEMAND' as any,
        isActive: true,
        integration: { 
          companyId, 
          isActive: true 
        }
      },
      include: { integration: true }
    });

    if (mapping && (order as any).externalId) {
      try {
        const erpItems = await IntegrationRuntime.fetchOnDemandDetail(
          mapping.integration,
          mapping,
          (order as any).externalId
        );

        if (erpItems) {
          return {
            ...order,
            items: Array.isArray(erpItems) ? erpItems : [erpItems],
            detailSource: 'ERP'
          };
        }
      } catch (err: any) {
        logger.error(`ERP detail fetch failed for order ${order.number}`, { error: err.message });
        return {
          ...order,
          items: [],
          detailUnavailable: true
        };
      }
    }

    return order;
  }
}
