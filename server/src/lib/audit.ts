import { prisma } from './prisma';
import { logger } from './logger';

export interface AuditLogOptions {
  companyId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
}

/**
 * Logs an administrative action to the AuditLog table.
 */
export async function logAction(options: AuditLogOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: options.companyId,
        userId: options.userId || null,
        userEmail: options.userEmail || null,
        action: options.action,
        resource: options.resource || null,
        resourceId: options.resourceId || null,
        details: options.details || null,
        ip: options.ip || null,
        userAgent: options.userAgent || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // We don't throw error here to avoid breaking the main business logic
    // if logging fails (e.g. database constraint issue).
  }
}
