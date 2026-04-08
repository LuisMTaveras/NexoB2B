import { getQueue, QUEUE_NAME, SyncJobPayload } from '../../lib/queue';
import { prisma } from '../../lib/prisma';
import { runSyncJob } from './sync.service';
import { logger } from '../../lib/logger';

const WORKER_CONCURRENCY = 3; // max simultaneous sync jobs

export async function startSyncWorker(): Promise<void> {
  const queue = await getQueue();

  queue.work(
    QUEUE_NAME,
    { teamSize: WORKER_CONCURRENCY, teamConcurrency: WORKER_CONCURRENCY },
    async (job: { id: string; data: SyncJobPayload }) => {
      const { integrationId, companyId, mappingId, resource, triggeredBy } = job.data;

      logger.info(`[Worker] Processing sync job ${job.id}`, {
        integrationId,
        mappingId,
        resource,
        triggeredBy,
      });

      // Load the mapping fresh from the database
      const mapping = await prisma.integrationMapping.findUnique({
        where: { id: mappingId },
      });

      if (!mapping) {
        logger.warn(`[Worker] Mapping ${mappingId} not found, skipping`);
        return;
      }

      if (!mapping.isActive) {
        logger.warn(`[Worker] Mapping ${mappingId} is inactive, skipping`);
        return;
      }

      // Update lastScheduledAt if triggered by scheduler
      if (triggeredBy === 'scheduler') {
        await prisma.integrationMapping.update({
          where: { id: mappingId },
          data: { lastScheduledAt: new Date() },
        });
      }

      try {
        // runSyncJob creates an IntegrationSyncJob record and runs the sync
        await runSyncJob(integrationId, companyId, mapping as any);
        logger.info(`[Worker] Completed sync job ${job.id} for ${resource}`);
      } catch (err: any) {
        logger.error(`[Worker] Sync job ${job.id} failed: ${err.message}`);
        throw err; // Re-throw so pg-boss knows to retry
      }
    },
  );

  logger.info(`[Worker] Sync worker started (concurrency: ${WORKER_CONCURRENCY})`);
}
