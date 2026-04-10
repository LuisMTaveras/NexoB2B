import { prisma } from './prisma';
import { scheduleCronSync, unscheduleCronSync, SyncJobPayload, scheduleSmartBasketCron, unscheduleSmartBasketCron } from './queue';
import { logger } from './logger';

/**
 * Registers all active cron schedules from the database into pg-boss.
 * Should be called on server startup.
 */
export async function loadSchedules(): Promise<void> {
  const scheduled = await prisma.integrationMapping.findMany({
    where: {
      isActive: true,
      isScheduled: true,
      syncCron: { not: null },
    },
    include: {
      integration: { select: { companyId: true, isActive: true } },
    },
  });

  logger.info(`[Scheduler] Loading ${scheduled.length} active cron schedule(s)`);

  for (const mapping of scheduled) {
    if (!mapping.integration.isActive) continue;
    if (!mapping.syncCron) continue;

    const payload: SyncJobPayload = {
      integrationId: mapping.integrationId,
      companyId: mapping.integration.companyId,
      mappingId: mapping.id,
      resource: mapping.resource,
      triggeredBy: 'scheduler',
    };

    try {
      await scheduleCronSync(mapping.id, mapping.syncCron, payload);
    } catch (err: any) {
      logger.error(`[Scheduler] Failed to register schedule for mapping ${mapping.id}: ${err.message}`);
    }
  }

  logger.info('[Scheduler] Integration schedules loaded');

  // Load Smart Basket schedules
  const sbScheduled = await prisma.smartBasketConfig.findMany({
    where: { isActive: true, frequency: { not: 'manual' } }
  });

  for (const config of sbScheduled) {
    const cron = configToCron(config.frequency, config.executionHour);
    await scheduleSmartBasketCron(config.companyId, cron, { companyId: config.companyId, triggeredBy: 'scheduler' });
  }

  logger.info(`[Scheduler] ${sbScheduled.length} Smart Basket schedules loaded`);
}

function configToCron(frequency: string, executionHour: string): string {
  const [hour, minute] = executionHour.split(':').map(Number);
  if (frequency === '12h') return `${minute} ${hour},${(hour + 12) % 24} * * *`;
  if (frequency === '48h') return `${minute} ${hour} */2 * *`;
  return `${minute} ${hour} * * *`; // Default 24h
}

/**
 * Register or update a cron schedule for a mapping.
 * Call this whenever a mapping's schedule is created or updated.
 */
export async function upsertMappingSchedule(mappingId: string): Promise<void> {
  const mapping = await prisma.integrationMapping.findUnique({
    where: { id: mappingId },
    include: { integration: { select: { companyId: true } } },
  });

  if (!mapping) return;

  // If scheduling is disabled or no cron expression, remove existing schedule
  if (!mapping.isScheduled || !mapping.syncCron || !mapping.isActive) {
    try {
      await unscheduleCronSync(mappingId);
    } catch { /* ignore if it didn't exist */ }
    return;
  }

  const payload: SyncJobPayload = {
    integrationId: mapping.integrationId,
    companyId: mapping.integration.companyId,
    mappingId: mapping.id,
    resource: mapping.resource,
    triggeredBy: 'scheduler',
  };

  await scheduleCronSync(mappingId, mapping.syncCron, payload);
}

/**
 * Remove a cron schedule for a specific mapping.
 */
export async function removeMappingSchedule(mappingId: string): Promise<void> {
  try {
    await unscheduleCronSync(mappingId);
    logger.info(`[Scheduler] Removed schedule for mapping ${mappingId}`);
  } catch {
    // Schedule may not have existed — safe to ignore
  }
}

export async function upsertSmartBasketSchedule(companyId: string): Promise<void> {
  const config = await prisma.smartBasketConfig.findUnique({ where: { companyId } });
  if (!config || !config.isActive || config.frequency === 'manual') {
    await unscheduleSmartBasketCron(companyId);
    return;
  }

  const cron = configToCron(config.frequency, config.executionHour);
  await scheduleSmartBasketCron(companyId, cron, { companyId, triggeredBy: 'scheduler' });
}
