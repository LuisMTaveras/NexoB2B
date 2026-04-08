import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../../utils/apiResponse';
import { authenticate, requireInternalUser } from '../../middleware/auth';
import { buildErpClient } from '../../lib/erpClient';
import { runSyncJob } from '../sync/sync.service';
import { enqueueSync, getQueue, QUEUE_NAME } from '../../lib/queue';
import { upsertMappingSchedule, removeMappingSchedule } from '../../lib/scheduler';

const router = Router();
router.use(authenticate, requireInternalUser);

// ─── Queue Monitoring ─────────────────────────────────────────────

// GET /api/integrations/queue/status
router.get('/queue/status', asyncHandler(async (req, res) => {
  const boss = await getQueue();
  
  const [queues, schedules, recentJobs] = await Promise.all([
    boss.getQueues(),
    boss.getSchedules(),
    prisma.integrationSyncJob.findMany({
      where: { integration: { companyId: req.companyId! } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        integration: { select: { name: true } }
      }
    })
  ]);

  const syncQueue = queues.find(q => q.name === QUEUE_NAME);
  
  // Enhance schedules with integration names
  const mappingIds = schedules.map(s => s.key);
  const mappings = await prisma.integrationMapping.findMany({
    where: { id: { in: mappingIds } },
    include: { integration: { select: { name: true } } }
  });

  const enhancedSchedules = schedules.map(s => {
    const mapping = mappings.find(m => m.id === s.key);
    return {
      ...s,
      integrationName: mapping?.integration?.name ?? 'Unknown',
      resource: mapping?.resource ?? 'Unknown'
    };
  });

  return sendSuccess(res, {
    stats: syncQueue || null,
    schedules: enhancedSchedules,
    recentJobs
  });
}));

// ─── CRUD Integrations ────────────────────────────────────────────

const createIntegrationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseUrl: z.string().url(),
  authMethod: z.enum(['API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'OAUTH2']),
  credentials: z.record(z.unknown()),
  headers: z.record(z.string()).optional(),
  testEndpoint: z.string().optional(),
});

// GET /api/integrations
router.get('/', asyncHandler(async (req, res) => {
  const integrations = await prisma.integration.findMany({
    where: { companyId: req.companyId! },
    include: {
      mappings: true,
      syncJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, integrations);
}));

// POST /api/integrations
router.post('/', asyncHandler(async (req, res) => {
  const data = createIntegrationSchema.parse(req.body);
  const integration = await prisma.integration.create({
    data: { ...data, credentials: data.credentials as any, headers: data.headers as any, companyId: req.companyId! },
  });
  return sendCreated(res, integration, 'Integration created');
}));

// GET /api/integrations/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const integration = await prisma.integration.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: {
      mappings: true,
      syncJobs: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!integration) return sendNotFound(res, 'Integration not found');
  return sendSuccess(res, integration);
}));

// PATCH /api/integrations/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.integration.findFirst({ where: { id: req.params.id, companyId: req.companyId! } });
  if (!existing) return sendNotFound(res);
  const { credentials, headers, ...rest } = req.body;
  const updated = await prisma.integration.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(credentials && { credentials }),
      ...(headers && { headers }),
    },
  });
  return sendSuccess(res, updated, 'Integration updated');
}));

// DELETE /api/integrations/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.integration.findFirst({ where: { id: req.params.id, companyId: req.companyId! } });
  if (!existing) return sendNotFound(res);
  await prisma.integration.delete({ where: { id: req.params.id } });
  return sendSuccess(res, null, 'Integration deleted');
}));

// ─── Test Connection ───────────────────────────────────────────────

// POST /api/integrations/:id/test
router.post('/:id/test', asyncHandler(async (req, res) => {
  const integration = await prisma.integration.findFirst({ where: { id: req.params.id, companyId: req.companyId! } });
  if (!integration) return sendNotFound(res);

  const client = buildErpClient(
    integration.baseUrl,
    integration.authMethod as any,
    integration.credentials as any,
    (integration.headers as Record<string, string>) ?? {},
  );

  const testEndpoint = integration.testEndpoint || req.body.endpoint || '/';
  const result = await client.testConnection(testEndpoint);

  if (result.ok) {
    await prisma.integration.update({ where: { id: integration.id }, data: { isActive: true } });
    return sendSuccess(res, result, 'Connection successful');
  } else {
    return sendError(res, `Connection failed: ${result.error}`, 400);
  }
}));

// ─── Mappings ─────────────────────────────────────────────────────

const createMappingSchema = z.object({
  resource: z.enum(['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'INVOICES', 'RECEIVABLES', 'ORDERS']),
  externalEndpoint: z.string().min(1),
  fieldMappings: z.record(z.string()),
  paginationConfig: z.object({
    type: z.enum(['page', 'offset', 'cursor', 'none']),
    pageParam: z.string().optional(),
    pageSizeParam: z.string().optional(),
    pageSize: z.number().default(100),
    offsetParam: z.string().optional(),
    cursorParam: z.string().optional(),
    nextCursorPath: z.string().optional(),
    dataPath: z.string().optional(),
    totalPath: z.string().optional(),
  }).optional(),
  queryParams: z.record(z.unknown()).optional(),
  // Scheduling
  isScheduled: z.boolean().optional().default(false),
  syncCron: z.string().optional().nullable(),
  syncInterval: z.string().optional().nullable(),
});

// GET /api/integrations/:id/mappings
router.get('/:id/mappings', asyncHandler(async (req, res) => {
  const mappings = await prisma.integrationMapping.findMany({
    where: { integrationId: req.params.id },
  });
  return sendSuccess(res, mappings);
}));

// POST /api/integrations/:id/mappings
router.post('/:id/mappings', asyncHandler(async (req, res) => {
  const integration = await prisma.integration.findFirst({ where: { id: req.params.id, companyId: req.companyId! } });
  if (!integration) return sendNotFound(res);

  const data = createMappingSchema.parse(req.body);

  const mapping = await prisma.integrationMapping.upsert({
    where: { integrationId_resource: { integrationId: req.params.id, resource: data.resource } },
    create: {
      integrationId: req.params.id,
      resource: data.resource,
      externalEndpoint: data.externalEndpoint,
      fieldMappings: data.fieldMappings as any,
      paginationConfig: data.paginationConfig as any,
      queryParams: data.queryParams as any,
      isScheduled: data.isScheduled ?? false,
      syncCron: data.syncCron ?? null,
      syncInterval: data.syncInterval ?? null,
    },
    update: {
      externalEndpoint: data.externalEndpoint,
      fieldMappings: data.fieldMappings as any,
      paginationConfig: data.paginationConfig as any,
      queryParams: data.queryParams as any,
      isScheduled: data.isScheduled ?? false,
      syncCron: data.syncCron ?? null,
      syncInterval: data.syncInterval ?? null,
    },
  });

  // Register or update cron schedule in pg-boss
  await upsertMappingSchedule(mapping.id);

  return sendCreated(res, mapping, 'Mapping saved');
}));

// PATCH /api/integrations/:id/mappings/:mappingId
router.patch('/:id/mappings/:mappingId', asyncHandler(async (req, res) => {
  const mapping = await prisma.integrationMapping.findFirst({
    where: { id: req.params.mappingId, integrationId: req.params.id },
  });
  if (!mapping) return sendNotFound(res);

  const updated = await prisma.integrationMapping.update({
    where: { id: req.params.mappingId },
    data: {
      ...(req.body.externalEndpoint && { externalEndpoint: req.body.externalEndpoint }),
      ...(req.body.fieldMappings && { fieldMappings: req.body.fieldMappings }),
      ...(req.body.paginationConfig && { paginationConfig: req.body.paginationConfig }),
      ...(req.body.queryParams && { queryParams: req.body.queryParams }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
    },
  });
  return sendSuccess(res, updated, 'Mapping updated');
}));

// DELETE /api/integrations/:id/mappings/:mappingId
router.delete('/:id/mappings/:mappingId', asyncHandler(async (req, res) => {
  await removeMappingSchedule(req.params.mappingId);
  await prisma.integrationMapping.delete({ where: { id: req.params.mappingId } });
  return sendSuccess(res, null, 'Mapping deleted');
}));

// ─── Sync ─────────────────────────────────────────────────────────

const syncSchema = z.object({
  resource: z.enum(['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS',
                    'INVOICES', 'RECEIVABLES', 'ORDERS', 'ALL']).default('ALL'),
});

// POST /api/integrations/:id/sync
router.post('/:id/sync', asyncHandler(async (req, res) => {
  const integration = await prisma.integration.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { mappings: { where: { isActive: true } } },
  });
  if (!integration) return sendNotFound(res);
  if (!integration.isActive) return sendError(res, 'Integration is not active. Test connection first.', 400);

  const { resource } = syncSchema.parse(req.body);

  // Check for running job
  const running = await prisma.integrationSyncJob.findFirst({
    where: { integrationId: integration.id, status: 'RUNNING' },
  });
  if (running) return sendError(res, 'A sync is already running for this integration', 409);

  const mappingsToSync = resource === 'ALL'
    ? integration.mappings
    : integration.mappings.filter((m) => m.resource === resource);

  if (mappingsToSync.length === 0) {
    return sendError(res, `No active mapping found for resource: ${resource}. Configure a mapping first.`, 400);
  }

  // Enqueue jobs via pg-boss (persisted, retriable, high-volume)
  const queueJobIds: (string | null)[] = [];
  for (const mapping of mappingsToSync) {
    const queueJobId = await enqueueSync({
      integrationId: integration.id,
      companyId: req.companyId!,
      mappingId: mapping.id,
      resource: mapping.resource,
      triggeredBy: 'manual',
    });
    queueJobIds.push(queueJobId);
  }

  return res.status(202).json({
    success: true,
    message: `Sync enqueued for ${mappingsToSync.length} resource(s)`,
    data: { queueJobIds },
  });
}));

// ─── Jobs & Logs ──────────────────────────────────────────────────

// GET /api/integrations/:id/jobs
router.get('/:id/jobs', asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.integrationSyncJob.findMany({
      where: { integrationId: req.params.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.integrationSyncJob.count({ where: { integrationId: req.params.id } }),
  ]);

  return sendSuccess(res, jobs, undefined, 200, { total, page, limit, totalPages: Math.ceil(total / limit) });
}));

// GET /api/integrations/:id/jobs/:jobId
router.get('/:id/jobs/:jobId', asyncHandler(async (req, res) => {
  const job = await prisma.integrationSyncJob.findUnique({
    where: { id: req.params.jobId },
    include: { _count: { select: { logs: true } } },
  });
  if (!job) return sendNotFound(res);
  return sendSuccess(res, job);
}));

// GET /api/integrations/:id/jobs/:jobId/logs
router.get('/:id/jobs/:jobId/logs', asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const skip = (page - 1) * limit;
  const level = req.query.level as string | undefined;

  const where: any = { jobId: req.params.jobId };
  if (level) where.level = level;

  const [logs, total] = await Promise.all([
    prisma.integrationSyncLog.findMany({ where, orderBy: { createdAt: 'asc' }, skip, take: limit }),
    prisma.integrationSyncLog.count({ where }),
  ]);

  return sendSuccess(res, logs, undefined, 200, { total, page, limit, totalPages: Math.ceil(total / limit) });
}));

export default router;
