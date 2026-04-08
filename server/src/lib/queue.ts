import { PgBoss } from 'pg-boss';
import { logger } from './logger';

export const QUEUE_NAME = 'integration-sync';

export interface SyncJobPayload {
  integrationId: string;
  companyId: string;
  mappingId: string;
  resource: string;
  triggeredBy: 'manual' | 'scheduler';
}

let boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
  if (boss) return boss;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  boss = new PgBoss({
    connectionString,
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    expireInSeconds: 60 * 60 * 2,
    deleteAfterSeconds: 60 * 60 * 24 * 7,
    monitorStateIntervalSeconds: 30,
    archiveCompletedAfterSeconds: 60 * 60 * 12,
  });

  boss.on('error', (error: Error) => logger.error('[Queue] pg-boss error:', error));
  boss.on('monitor-states', (states: any) => {
    logger.info('[Queue] state monitor', states);
  });

  await boss.start();
  // Ensure the queue exists before workers try to subscribe
  await boss.createQueue(QUEUE_NAME);
  logger.info(`[Queue] pg-boss started and connected. Queue "${QUEUE_NAME}" ensured.`);

  return boss;
}

export async function enqueueSync(payload: SyncJobPayload, options?: { runAt?: Date }): Promise<string | null> {
  const queue = await getQueue();

  const jobId = await queue.send(QUEUE_NAME, payload, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    ...(options?.runAt && { startAfter: options.runAt }),
  });

  logger.info(`[Queue] Enqueued sync job ${jobId} for integration ${payload.integrationId} / resource ${payload.resource}`);
  return jobId;
}

/**
 * Register a cron schedule in pg-boss.
 * 
 * pg-boss v12 schedule API: schedule(name, cron, data, options)
 *   - name: must be an existing queue name (foreign key constraint)
 *   - key:  differentiates multiple schedules on the same queue
 *   - data: the payload sent when the cron fires
 * 
 * We use QUEUE_NAME as the schedule name and the mappingId as the key.
 */
export async function scheduleCronSync(
  mappingKey: string,
  cron: string,
  payload: SyncJobPayload,
): Promise<void> {
  const queue = await getQueue();
  await queue.schedule(QUEUE_NAME, cron, payload, {
    tz: 'America/Santo_Domingo',
    key: mappingKey,
  });
  logger.info(`[Queue] Cron schedule registered queue="${QUEUE_NAME}" key="${mappingKey}" cron="${cron}"`);
}

export async function unscheduleCronSync(mappingKey: string): Promise<void> {
  const queue = await getQueue();
  await queue.unschedule(QUEUE_NAME, mappingKey);
  logger.info(`[Queue] Cron schedule removed: queue="${QUEUE_NAME}" key="${mappingKey}"`);
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
    logger.info('[Queue] pg-boss stopped');
  }
}
