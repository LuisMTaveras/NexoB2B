import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { logAction } from '../../lib/audit';

export const listPermissions = asyncHandler(async (req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { module: 'asc' },
      { name: 'asc' }
    ]
  });
  return sendSuccess(res, permissions);
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { companyId: null }, // System global roles
        { companyId: req.companyId } // Specific company roles
      ]
    },
    include: {
      permissions: {
        include: { permission: true }
      },
      _count: {
        select: { users: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return sendSuccess(res, roles);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, permissionIds } = req.body;

  // Check unique name for company
  const existing = await prisma.role.findFirst({
    where: { companyId: req.companyId, name }
  });
  if (existing) throw new AppError('Ya existe un rol con este nombre en tu empresa', 400);

  const role = await prisma.role.create({
    data: {
      name,
      description,
      companyId: req.companyId!,
      isSystem: false,
      permissions: {
        create: permissionIds.map((pId: string) => ({
          permission: { connect: { id: pId } }
        }))
      }
    },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'ROLE_CREATED',
    resource: 'Role',
    resourceId: role.id,
    details: { name, permissionCount: permissionIds.length }
  });

  return sendCreated(res, role);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, permissionIds } = req.body;

  const role = await prisma.role.findFirst({
    where: { id, companyId: req.companyId }
  });

  if (!role) return sendNotFound(res, 'Rol no encontrado o no autorizado');
  if (role.isSystem) throw new AppError('Los roles del sistema no pueden ser editados', 403);

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Delete old permissions associations
    if (permissionIds) {
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });
    }

    // 2. Update role and create new associations
    return await tx.role.update({
      where: { id },
      data: {
        name,
        description,
        ...(permissionIds && {
          permissions: {
            create: permissionIds.map((pId: string) => ({
              permission: { connect: { id: pId } }
            }))
          }
        })
      },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  });

  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'ROLE_UPDATED',
    resource: 'Role',
    resourceId: id,
    details: { name }
  });

  return sendSuccess(res, updated);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await prisma.role.findFirst({
    where: { id, companyId: req.companyId },
    include: { _count: { select: { users: true } } }
  });

  if (!role) return sendNotFound(res);
  if (role.isSystem) throw new AppError('No se pueden eliminar roles del sistema', 403);
  if (role._count.users > 0) {
    throw new AppError('No se puede eliminar un rol que tiene usuarios asignados. Reasigna a los usuarios primero.', 400);
  }

  await prisma.role.delete({ where: { id } });

  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'ROLE_DELETED',
    resource: 'Role',
    resourceId: id,
    details: { name: role.name }
  });

  return sendSuccess(res, null, 'Rol eliminado');
});
