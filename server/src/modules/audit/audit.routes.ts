import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { authenticate, requireInternalUser } from '../../middleware/auth';

const router = Router();

router.use(authenticate, requireInternalUser);

/**
 * GET /api/admin/audit-logs
 * Retrieves audit logs for the current company with pagination, filters and grouping support.
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const skip = (page - 1) * limit;
  
  const action = req.query.action as string | undefined;
  const resource = req.query.resource as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  
  // Robust boolean detection for potential string/bool variation
  const grouped = String(req.query.grouped).toLowerCase() === 'true';

  const where: any = { companyId: req.companyId! };
  
  if (action) where.action = action;
  if (resource) where.resource = resource;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  // If grouping, we fetch a larger pool to ensure we catch related events across multiple raw rows
  const fetchLimit = grouped ? 2000 : limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: grouped ? 0 : skip, 
      take: fetchLimit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, id: true } }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  if (!grouped) {
    return sendSuccess(res, logs, undefined, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  }

  // Grouping Logic: Bitácora Style (Robust Fix)
  const processedLogs: any[] = [];
  const resourceGroups = new Map<string, any>();

  for (const log of logs) {
    // 1. Logins stay individual for pinpoint security monitoring
    const isLogin = log.action === 'USER_LOGIN';
    const hasResourceId = !!log.resourceId;

    if (isLogin || !hasResourceId) {
      processedLogs.push({
        ...log,
        isGroup: false,
        eventCount: 1,
        history: [log]
      });
    } else {
      // Normalize Key (Resource Name + ID)
      const resName = String(log.resource || 'Unknown').toLowerCase();
      const key = `${resName}:${log.resourceId}`;

      if (resourceGroups.has(key)) {
        const group = resourceGroups.get(key);
        group.eventCount++;
        group.history.push(log);
      } else {
        const group = {
          ...log,
          isGroup: true,
          eventCount: 1,
          history: [log]
        };
        resourceGroups.set(key, group);
        processedLogs.push(group);
      }
    }
  }

  // Re-apply pagination to the grouped set
  const paginatedResults = processedLogs.slice(skip, skip + limit);

  return sendSuccess(res, paginatedResults, undefined, 200, {
    total: processedLogs.length,
    page,
    limit,
    totalPages: Math.ceil(processedLogs.length / limit)
  });
}));

export default router;
