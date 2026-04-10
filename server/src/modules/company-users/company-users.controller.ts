import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { logAction } from '../../lib/audit';
import crypto from 'crypto';
import { EmailService } from '../../lib/email.service';
import { env } from '../../config/env';

export const listCompanyUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.internalUser.findMany({
    where: { companyId: req.companyId },
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, users);
});

export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, firstName, lastName, roleId } = req.body;

  // Check if user already exists
  const existing = await prisma.internalUser.findUnique({ where: { email } });
  if (existing) throw new AppError('El correo electrónico ya está en uso', 409);

  // Validate role exists and belongs to company (or is system)
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      OR: [{ companyId: null }, { companyId: req.companyId }]
    }
  });
  if (!role) throw new AppError('Rol inválido o no encontrado', 400);

  // Create user in INVITED status
  const user = await prisma.internalUser.create({
    data: {
      email,
      firstName,
      lastName,
      companyId: req.companyId!,
      roleId,
      status: 'INVITED',
      passwordHash: 'INVITED_' + crypto.randomBytes(8).toString('hex'), // Placeholder
    },
    include: { role: true }
  });

  // Create invitation token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  await prisma.verificationToken.create({
    data: {
      internalUserId: user.id,
      token,
      type: 'INVITATION',
      expiresAt
    }
  });

  // Audit
  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'INTERNAL_USER_INVITED',
    resource: 'InternalUser',
    resourceId: user.id,
    details: { email, role: role.name }
  });

  // Send Email (Background)
  const setupUrl = `${env.CLIENT_URL}/setup-account?token=${token}`;
  
  let emailSent = false;
  let emailError = null;

  try {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    const html = EmailService.getInvitationTemplate({
      companyName: company?.name || 'NexoB2B',
      companyLogo: company?.logo,
      customerName: firstName,
      setupUrl: setupUrl
    });

    const transporterData = await EmailService.getCompanyTransporter(req.companyId!);
    if (transporterData) {
      await transporterData.transporter.sendMail({
        from: transporterData.from,
        to: email,
        subject: `Invitación para unirse a ${company?.name} en NexoB2B`,
        html
      });
      emailSent = true;
    } else {
      console.warn(`No email config found for company ${req.companyId}. Invitation not sent via SMTP.`);
      emailError = 'SMTP no configurado';
    }
  } catch (err: any) {
    console.error('Failed to send invitation email:', err);
    emailError = err.message;
  }

  return sendCreated(res, {
    ...user,
    invitationUrl: setupUrl,
    emailSent,
    emailError
  }, emailSent 
    ? 'Empleado invitado exitosamente. Se ha enviado un correo de configuración.' 
    : 'Empleado creado, pero no se pudo enviar el correo. Copia el enlace manual.');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, roleId, status } = req.body;

  const user = await prisma.internalUser.findFirst({
    where: { id, companyId: req.companyId }
  });

  if (!user) return sendNotFound(res, 'Usuario no encontrado');

  // Prevent self-demotion or self-deactivation of the last ADMIN to avoid lockouts
  if (id === req.user!.userId && (status === 'INACTIVE' || (roleId && roleId !== user.roleId))) {
    // Check if there are other active ADMINs
    const otherAdmins = await prisma.internalUser.count({
      where: {
        companyId: req.companyId,
        id: { not: id },
        role: { name: 'ADMIN' },
        status: 'ACTIVE'
      }
    });
    if (otherAdmins === 0) {
      throw new AppError('No puedes desactivar o cambiar el rol del único administrador activo.', 400);
    }
  }

  const updated = await prisma.internalUser.update({
    where: { id },
    data: { firstName, lastName, roleId, status },
    include: { role: true }
  });

  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'INTERNAL_USER_UPDATED',
    resource: 'InternalUser',
    resourceId: id,
    details: { changes: req.body }
  });

  return sendSuccess(res, updated, 'Usuario actualizado');
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.internalUser.findFirst({
    where: { id, companyId: req.companyId },
    include: { role: true }
  });

  if (!user) return sendNotFound(res);

  if (user.role?.name === 'ADMIN') {
     const adminCount = await prisma.internalUser.count({
      where: { companyId: req.companyId, role: { name: 'ADMIN' } }
    });
    if (adminCount <= 1) {
      throw new AppError('No se puede eliminar al único administrador de la empresa.', 400);
    }
  }

  await prisma.internalUser.delete({ where: { id } });

  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'INTERNAL_USER_DELETED',
    resource: 'InternalUser',
    resourceId: id,
    details: { email: user.email }
  });

  return sendSuccess(res, null, 'Usuario eliminado definitivamente');
});
