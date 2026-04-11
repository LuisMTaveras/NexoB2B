import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { subDays } from 'date-fns';

export class MaintenanceService {
  /**
   * Deletes logs older than the specified number of days.
   * Default: 30 days.
   */
  static async cleanupLogs(days = 30) {
    const threshold = subDays(new Date(), days);
    
    console.log(`🧹 Starting log cleanup (older than ${days} days: ${threshold.toISOString()})...`);

    try {
      // 1. Sync Logs
      const syncLogs = await prisma.integrationSyncLog.deleteMany({
        where: { createdAt: { lt: threshold } }
      });
      console.log(`✅ Deleted ${syncLogs.count} IntegrationSyncLogs.`);

      // 2. Sync Jobs (optional, keep them longer? Let's say 90 days for jobs)
      const jobThreshold = subDays(new Date(), 90);
      const syncJobs = await prisma.integrationSyncJob.deleteMany({
        where: { startedAt: { lt: jobThreshold } }
      });
      console.log(`✅ Deleted ${syncJobs.count} IntegrationSyncJobs (older than 90 days).`);

      // 3. Audit Logs (Business critical, keep 1 year by default)
      const auditThreshold = subDays(new Date(), 365);
      const auditLogs = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: auditThreshold } }
      });
      console.log(`✅ Deleted ${auditLogs.count} AuditLogs (older than 365 days).`);

      logger.info('Log cleanup completed successfully', { 
        syncLogsDeleted: syncLogs.count,
        syncJobsDeleted: syncJobs.count,
        auditLogsDeleted: auditLogs.count
      });
    } catch (err) {
      logger.error('Failed to cleanup logs', err);
      throw err;
    }
  }
}
