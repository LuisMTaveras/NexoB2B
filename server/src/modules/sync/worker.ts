import { getQueue, QUEUE_NAME, SyncJobPayload } from '../../lib/queue';
import { prisma } from '../../lib/prisma';
import { runSyncJob } from './sync.service';
import { logger } from '../../lib/logger';

const WORKER_CONCURRENCY = 3; // max simultaneous sync jobs

export async function startSyncWorker(): Promise<void> {
  const queue = await getQueue();

  await queue.work(
    QUEUE_NAME,
    { 
      batchSize: 1, 
      localConcurrency: WORKER_CONCURRENCY 
    },
    async (jobs) => {
      // In pg-boss v10+, the handler always receives an array of jobs
      await Promise.all(jobs.map(async (job: any) => {
        const { integrationId, companyId, mappingId, syncJobId, resource, triggeredBy } = job.data as SyncJobPayload;

        logger.info(`[Worker] Processing sync job ${job.id} (Internal ID: ${syncJobId || 'NONE'})`, {
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
          // runSyncJob uses the existing IntegrationSyncJob if syncJobId is provided
          await runSyncJob(integrationId, companyId, mapping as any, syncJobId);
          logger.info(`[Worker] Completed sync job ${job.id} for ${resource}`);
        } catch (err: any) {
          logger.error(`[Worker] Sync job ${job.id} failed: ${err.message}`);
          throw err; // Re-throw so pg-boss knows to retry
        }
      }));
    }
  );

  logger.info(`[Worker] Sync worker started (concurrency: ${WORKER_CONCURRENCY})`);
}
