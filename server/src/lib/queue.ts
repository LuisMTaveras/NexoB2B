// pg-boss does not ship full ESM-compatible type declarations for direct import.
// We use a workaround: dynamic require and cast to `any` for the constructor,
// letting us still benefit from IntelliSense through the Boss instance.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PgBoss = require('pg-boss') as {
  new(options: Record<string, unknown>): any;
  prototype: any;
};

import { logger } from './logger';

export const QUEUE_NAME = 'integration-sync';

export interface SyncJobPayload {
  integrationId: string;
  companyId: string;
  mappingId: string;
  resource: string;
  triggeredBy: 'manual' | 'scheduler';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let boss: any = null;

export async function getQueue(): Promise<any> {
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
  boss.on('monitor-states', (states: Record<string, unknown>) => {
    logger.info('[Queue] state monitor', states);
  });

  await boss.start();
  logger.info('[Queue] pg-boss started and connected');

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

export async function scheduleCronSync(
  scheduleId: string,
  cron: string,
  payload: SyncJobPayload,
): Promise<void> {
  const queue = await getQueue();
  await queue.schedule(scheduleId, cron, payload, {
    tz: 'America/Santo_Domingo',
  });
  logger.info(`[Queue] Cron schedule registered "${scheduleId}" with pattern "${cron}"`);
}

export async function unscheduleCronSync(scheduleId: string): Promise<void> {
  const queue = await getQueue();
  await queue.unschedule(scheduleId);
  logger.info(`[Queue] Cron schedule removed: ${scheduleId}`);
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
    logger.info('[Queue] pg-boss stopped');
  }
}
