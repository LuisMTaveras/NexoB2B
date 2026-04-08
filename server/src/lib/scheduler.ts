import { prisma } from './prisma';
import { scheduleCronSync, unscheduleCronSync, SyncJobPayload } from './queue';
import { logger } from './logger';

/**
 * Generates a stable, unique schedule ID for a mapping.
 * Used to idempotently register/update/remove schedules.
 */
function scheduleId(mappingId: string): string {
  return `sync:${mappingId}`;
}

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
      await scheduleCronSync(scheduleId(mapping.id), mapping.syncCron, payload);
    } catch (err: any) {
      logger.error(`[Scheduler] Failed to register schedule for mapping ${mapping.id}: ${err.message}`);
    }
  }

  logger.info('[Scheduler] All schedules loaded');
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

  if (!mapping.isScheduled || !mapping.syncCron || !mapping.isActive) {
    // Try to remove any existing schedule
    try {
      await unscheduleCronSync(scheduleId(mappingId));
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

  await scheduleCronSync(scheduleId(mappingId), mapping.syncCron, payload);
}

/**
 * Remove a cron schedule for a specific mapping.
 */
export async function removeMappingSchedule(mappingId: string): Promise<void> {
  try {
    await unscheduleCronSync(scheduleId(mappingId));
    logger.info(`[Scheduler] Removed schedule for mapping ${mappingId}`);
  } catch {
    // Schedule may not have existed — safe to ignore
  }
}
