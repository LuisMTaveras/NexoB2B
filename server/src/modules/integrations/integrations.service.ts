import { prisma } from '../../lib/prisma';
import { encrypt, decrypt } from '../../lib/crypto';
import { buildErpClient } from '../../lib/erpClient';
import { logAction } from '../../lib/audit';
import { enqueueSync } from '../../lib/queue';
import { upsertMappingSchedule } from '../../lib/scheduler';
import { SyncResource } from '@prisma/client';

export class IntegrationsService {
  /**
   * Encrypts the credentials object if it exists.
   */
  private static encryptCredentials(credentials: any): any {
    if (!credentials) return credentials;
    const str = JSON.stringify(credentials);
    return { _encrypted: encrypt(str) };
  }

  /**
   * Decrypts the credentials object if it's encrypted.
   */
  private static decryptCredentials(credentials: any): any {
    if (credentials && credentials._encrypted) {
      try {
        const decrypted = decrypt(credentials._encrypted);
        return JSON.parse(decrypted);
      } catch (err) {
        console.error('[IntegrationsService] Failed to decrypt credentials', err);
        return credentials; // Fallback to original if decryption fails (might be plain text from before)
      }
    }
    return credentials;
  }

  static async findAll(companyId: string) {
    const integrations = await prisma.integration.findMany({
      where: { companyId },
      include: {
        mappings: true,
        syncJobs: { orderBy: { createdAt: 'desc' }, take: 15 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return integrations.map(i => ({
      ...i,
      credentials: this.decryptCredentials(i.credentials)
    }));
  }

  static async findById(id: string, companyId: string) {
    const integration = await prisma.integration.findFirst({
      where: { id, companyId },
      include: {
        mappings: true,
        syncJobs: { orderBy: { createdAt: 'desc' }, take: 15 },
      },
    });

    if (!integration) return null;

    return {
      ...integration,
      credentials: this.decryptCredentials(integration.credentials)
    };
  }

  static async create(companyId: string, data: any, auditInfo: { userId: string; email: string; ip?: string; userAgent?: string }) {
    const encryptedData = {
      ...data,
      credentials: this.encryptCredentials(data.credentials),
      companyId,
    };

    const integration = await prisma.integration.create({
      data: encryptedData,
    });

    await logAction({
      companyId,
      userId: auditInfo.userId,
      userEmail: auditInfo.email,
      action: 'INTEGRATION_CREATED',
      resource: 'Integration',
      resourceId: integration.id,
      ip: auditInfo.ip,
      userAgent: auditInfo.userAgent,
      details: { name: integration.name, authMethod: integration.authMethod }
    });

    return {
      ...integration,
      credentials: data.credentials // Return decrypted to the caller
    };
  }

  static async update(id: string, companyId: string, data: any, auditInfo: { userId: string; email: string; ip?: string; userAgent?: string }) {
    const existing = await prisma.integration.findFirst({ where: { id, companyId } });
    if (!existing) return null;

    const { credentials, ...rest } = data;
    const updateData: any = { ...rest };
    
    if (credentials) {
      updateData.credentials = this.encryptCredentials(credentials);
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      companyId,
      userId: auditInfo.userId,
      userEmail: auditInfo.email,
      action: 'INTEGRATION_UPDATED',
      resource: 'Integration',
      resourceId: updated.id,
      ip: auditInfo.ip,
      userAgent: auditInfo.userAgent,
      details: { name: updated.name, changedFields: Object.keys(data) }
    });

    return {
      ...updated,
      credentials: credentials || this.decryptCredentials(updated.credentials)
    };
  }

  static async delete(id: string, companyId: string, auditInfo: { userId: string; email: string; ip?: string; userAgent?: string }) {
    const existing = await prisma.integration.findFirst({ where: { id, companyId } });
    if (!existing) return false;

    await prisma.integration.delete({ where: { id } });

    await logAction({
      companyId,
      userId: auditInfo.userId,
      userEmail: auditInfo.email,
      action: 'INTEGRATION_DELETED',
      resource: 'Integration',
      resourceId: id,
      ip: auditInfo.ip,
      userAgent: auditInfo.userAgent,
      details: { name: existing.name }
    });

    return true;
  }

  static async testConnection(id: string, companyId: string, endpoint?: string) {
    const integration = await this.findById(id, companyId);
    if (!integration) return { ok: false, error: 'Integration not found' };

    const client = buildErpClient(
      integration.baseUrl,
      integration.authMethod as any,
      integration.credentials as any,
      (integration.headers as Record<string, string>) ?? {},
    );

    const testEndpoint = integration.testEndpoint || endpoint || '/';
    const result = await client.testConnection(testEndpoint);

    if (result.ok) {
      await prisma.integration.update({ where: { id }, data: { isActive: true } });
    }

    return result;
  }

  static async triggerSync(id: string, companyId: string, resource: SyncResource | 'ALL', auditInfo: { userId: string; email: string; ip?: string; userAgent?: string }) {
    const integration = await prisma.integration.findFirst({
      where: { id, companyId },
      include: { mappings: { where: { isActive: true } } },
    });

    if (!integration) throw new Error('Integration not found');
    if (!integration.isActive) throw new Error('Integration is not active');

    const running = await prisma.integrationSyncJob.findFirst({
      where: { integrationId: id, status: 'RUNNING' },
    });
    if (running) throw new Error('A sync is already running');

    const mappingsToSync = resource === 'ALL'
      ? integration.mappings.filter(m => m.direction === 'INBOUND')
      : integration.mappings.filter((m) => m.resource === resource && m.direction === 'INBOUND');

    if (mappingsToSync.length === 0) throw new Error(`No active inbound mapping for ${resource}`);

    const queueJobIds: (string | null)[] = [];
    for (const mapping of mappingsToSync) {
      const syncJob = await prisma.integrationSyncJob.create({
        data: {
          integrationId: id,
          resource: mapping.resource,
          status: 'PENDING',
          triggeredBy: 'manual',
        }
      });

      const queueJobId = await enqueueSync({
        integrationId: id,
        companyId,
        mappingId: mapping.id,
        syncJobId: syncJob.id,
        resource: mapping.resource,
        triggeredBy: 'manual',
      });
      queueJobIds.push(queueJobId);
    }

    await logAction({
      companyId,
      userId: auditInfo.userId,
      userEmail: auditInfo.email,
      action: 'INTEGRATION_SYNC_TRIGGERED',
      resource: 'Integration',
      resourceId: id,
      ip: auditInfo.ip,
      userAgent: auditInfo.userAgent,
      details: { resource }
    });

    return queueJobIds;
  }
}
