import { PgBoss } from 'pg-boss';
import { logger } from './logger';

export const QUEUE_NAME = 'integration-sync';
export const SMART_BASKET_QUEUE = 'smart-basket';

export interface SyncJobPayload {
  integrationId: string;
  companyId: string;
  mappingId: string;
  syncJobId?: string; // Internal Prisma record ID
  resource: string;
  triggeredBy: 'manual' | 'scheduler';
}

export interface SmartBasketJobPayload {
  companyId: string;
  triggeredBy: 'manual' | 'scheduler';
}

let boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
  if (boss) return boss;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  boss = new PgBoss({
    connectionString,
    monitorIntervalSeconds: 30,
  });

  boss.on('error', (error: Error) => logger.error('[Queue] pg-boss error:', error));
  // PgBoss v12 uses a diferentes events mapping. monitor-states is no longer a simple event with states.
  // We can use the 'wip' event or similar if needed, or just remove for now if it causes issues.
  
  await boss.start();
  // Ensure the queues exist
  await boss.createQueue(QUEUE_NAME);
  await boss.createQueue(SMART_BASKET_QUEUE);
  logger.info(`[Queue] pg-boss started. Queues "${QUEUE_NAME}" and "${SMART_BASKET_QUEUE}" ensured.`);

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

export async function scheduleSmartBasketCron(
  companyId: string,
  cron: string,
  payload: SmartBasketJobPayload,
): Promise<void> {
  const queue = await getQueue();
  await queue.schedule(SMART_BASKET_QUEUE, cron, payload, {
    tz: 'America/Santo_Domingo',
    key: `sb-${companyId}`,
  });
  logger.info(`[Queue] Smart Basket schedule registered key="sb-${companyId}" cron="${cron}"`);
}

export async function unscheduleSmartBasketCron(companyId: string): Promise<void> {
  const queue = await getQueue();
  await queue.unschedule(SMART_BASKET_QUEUE, `sb-${companyId}`);
  logger.info(`[Queue] Smart Basket schedule removed: key="sb-${companyId}"`);
}

export async function enqueueSmartBasket(payload: SmartBasketJobPayload): Promise<string | null> {
  const queue = await getQueue();
  const jobId = await queue.send(SMART_BASKET_QUEUE, payload);
  logger.info(`[Queue] Enqueued manual Smart Basket job ${jobId} for company ${payload.companyId}`);
  return jobId;
}
