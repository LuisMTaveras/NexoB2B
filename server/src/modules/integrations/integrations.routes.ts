import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../../utils/apiResponse';
import { authenticate, requireInternalUser } from '../../middleware/auth';
import { IntegrationsService } from './integrations.service';
import { getQueue, QUEUE_NAME } from '../../lib/queue';
import { upsertMappingSchedule, removeMappingSchedule } from '../../lib/scheduler';
import { buildErpClient } from '../../lib/erpClient';
import { SyncResource } from '@prisma/client';

const router = Router();
router.use(authenticate, requireInternalUser);

// ─── Queue Monitoring ─────────────────────────────────────────────

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
  const stats = syncQueue ? {
    activeCount: syncQueue.activeCount ?? 0,
    queuedCount: (syncQueue.queuedCount ?? 0) + (syncQueue.deferredCount ?? 0),
    totalCount: syncQueue.totalCount ?? 0
  } : { activeCount: 0, queuedCount: 0, totalCount: 0 };
  
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

  return sendSuccess(res, { stats, schedules: enhancedSchedules, recentJobs });
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

router.get('/', asyncHandler(async (req, res) => {
  const integrations = await IntegrationsService.findAll(req.companyId!);
  return sendSuccess(res, integrations);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = createIntegrationSchema.parse(req.body);
  const integration = await IntegrationsService.create(req.companyId!, data, {
    userId: req.user!.userId,
    email: req.user!.email,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  return sendCreated(res, integration, 'Integration created');
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const integration = await IntegrationsService.findById(req.params.id, req.companyId!);
  if (!integration) return sendNotFound(res, 'Integration not found');
  return sendSuccess(res, integration);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const updated = await IntegrationsService.update(req.params.id, req.companyId!, req.body, {
    userId: req.user!.userId,
    email: req.user!.email,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  if (!updated) return sendNotFound(res);
  return sendSuccess(res, updated, 'Integration updated');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const success = await IntegrationsService.delete(req.params.id, req.companyId!, {
    userId: req.user!.userId,
    email: req.user!.email,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  if (!success) return sendNotFound(res);
  return sendSuccess(res, null, 'Integration deleted');
}));

// ─── Test Connection ───────────────────────────────────────────────

router.post('/:id/test', asyncHandler(async (req, res) => {
  const result = await IntegrationsService.testConnection(req.params.id, req.companyId!, req.body.endpoint);
  if (result.ok) return sendSuccess(res, result, 'Connection successful');
  return sendError(res, `Connection failed: ${result.error}`, 400);
}));

// ─── Mappings ─────────────────────────────────────────────────────

const createMappingSchema = z.object({
  resource: z.enum(['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'INVOICES', 'RECEIVABLES', 'ORDERS', 'PAYMENTS']),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('INBOUND'),
  method: z.string().default('GET'),
  externalEndpoint: z.string().min(1),
  fieldMappings: z.record(z.unknown()),
  transforms: z.record(z.unknown()).optional().nullable(),
  extendedFieldsDef: z.record(z.unknown()).optional().nullable(),
  successIdField: z.string().optional().nullable(),
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
  }).optional().nullable(),
  detailEndpoint: z.string().optional().nullable(),
  detailDataPath: z.string().optional().nullable(),
  detailFetchOn: z.enum(['ON_BATCH', 'ON_DEMAND']).optional().default('ON_BATCH'),
  detailFieldMappings: z.record(z.unknown()).optional().nullable(),
  queryParams: z.record(z.unknown()).optional().nullable(),
  isScheduled: z.boolean().optional().default(false),
  syncCron: z.string().optional().nullable(),
  syncInterval: z.string().optional().nullable(),
});

router.get('/:id/mappings', asyncHandler(async (req, res) => {
  const mappings = await prisma.integrationMapping.findMany({ where: { integrationId: req.params.id } });
  return sendSuccess(res, mappings);
}));

router.post('/:id/mappings', asyncHandler(async (req, res) => {
  const integration = await prisma.integration.findFirst({ where: { id: req.params.id, companyId: req.companyId! } });
  if (!integration) return sendNotFound(res);

  const data = createMappingSchema.parse(req.body);
  const mapping = await prisma.integrationMapping.upsert({
    where: { 
      integrationId_resource_direction: { 
        integrationId: req.params.id, 
        resource: data.resource,
        direction: data.direction || 'INBOUND'
      } 
    },
    create: { ...data, integrationId: req.params.id },
    update: { ...data },
  });

  await upsertMappingSchedule(mapping.id);
  return sendCreated(res, mapping, 'Mapping saved');
}));

router.patch('/:id/mappings/:mappingId', asyncHandler(async (req, res) => {
  const updated = await prisma.integrationMapping.update({
    where: { id: req.params.mappingId },
    data: req.body,
  });
  await upsertMappingSchedule(updated.id);
  return sendSuccess(res, updated, 'Mapping updated');
}));

router.delete('/:id/mappings/:mappingId', asyncHandler(async (req, res) => {
  await removeMappingSchedule(req.params.mappingId);
  await prisma.integrationMapping.delete({ where: { id: req.params.mappingId } });
  return sendSuccess(res, null, 'Mapping deleted');
}));

// ─── Sync ─────────────────────────────────────────────────────────

router.post('/:id/sync', asyncHandler(async (req, res) => {
  try {
    const resource = (req.body.resource as SyncResource | 'ALL') || 'ALL';
    const queueJobIds = await IntegrationsService.triggerSync(req.params.id, req.companyId!, resource, {
      userId: req.user!.userId,
      email: req.user!.email,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(202).json({ success: true, message: `Sync enqueued`, data: { queueJobIds } });
  } catch (err: any) {
    return sendError(res, err.message, err.message.includes('not found') ? 404 : 400);
  }
}));

// ─── Jobs & Logs ──────────────────────────────────────────────────

router.get('/:id/jobs', asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.integrationSyncJob.findMany({ where: { integrationId: req.params.id }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.integrationSyncJob.count({ where: { integrationId: req.params.id } }),
  ]);
  return sendSuccess(res, jobs, undefined, 200, { total, page, limit, totalPages: Math.ceil(total / limit) });
}));

router.get('/:id/jobs/:jobId', asyncHandler(async (req, res) => {
  const job = await prisma.integrationSyncJob.findUnique({ where: { id: req.params.jobId } });
  if (!job) return sendNotFound(res);
  return sendSuccess(res, job);
}));

router.get('/:id/jobs/:jobId/logs', asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const skip = (page - 1) * limit;
  const level = req.query.level as string | undefined;

  const [logs, total] = await Promise.all([
    prisma.integrationSyncLog.findMany({ where: { jobId: req.params.jobId, ...(level && { level }) }, orderBy: { createdAt: 'asc' }, skip, take: limit }),
    prisma.integrationSyncLog.count({ where: { jobId: req.params.jobId, ...(level && { level }) } }),
  ]);
  return sendSuccess(res, logs, undefined, 200, { total, page, limit, totalPages: Math.ceil(total / limit) });
}));

// ─── Smart Integration Tools ──────────────────────────────────────

const SCHEMA_FIELDS: Record<string, string[]> = {
  PRODUCTS: ['sku', 'name', 'description', 'price', 'currency', 'stock', 'imageUrl', 'category', 'brand', 'unit'],
  CUSTOMERS: ['internalCode', 'name', 'email', 'taxId', 'phone', 'address', 'city', 'country'],
  INVOICES: ['number', 'date', 'total', 'currency', 'status', 'dueDate'],
  ORDERS: ['number', 'date', 'total', 'currency', 'status', 'notes']
};

router.post('/:id/smart/suggest', asyncHandler(async (req, res) => {
  const { resource, endpoint } = req.body;
  if (!resource || !SCHEMA_FIELDS[resource]) return sendError(res, 'Invalid resource', 400);

  const integration = await IntegrationsService.findById(req.params.id, req.companyId!);
  if (!integration) return sendNotFound(res);

  const client = buildErpClient(integration.baseUrl, integration.authMethod as any, integration.credentials as any, (integration.headers as Record<string, string>) ?? {});
  const response = await client.getHttp().get(endpoint, { params: { limit: 1 } });

  let sampleObj: any = null;
  const data = response.data;
  if (Array.isArray(data) && data.length > 0) sampleObj = data[0];
  else if (data && typeof data === 'object') sampleObj = Object.values(data).find(v => Array.isArray(v))?.[0] || data;

  if (!sampleObj) return sendError(res, 'No sample data', 400);

  const erpKeys = Object.keys(sampleObj);
  const suggestedMappings: Record<string, string> = {};
  SCHEMA_FIELDS[resource].forEach(field => {
    const match = erpKeys.find(key => key.toLowerCase().includes(field.toLowerCase()) || field.toLowerCase().includes(key.toLowerCase()));
    if (match) suggestedMappings[field] = match;
  });

  return sendSuccess(res, { suggestedMappings, erpKeys });
}));

export default router;
