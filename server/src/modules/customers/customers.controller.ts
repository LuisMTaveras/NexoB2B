import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { EmailService } from '../../lib/email.service';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { logAction } from '../../lib/audit';
import { exportToCsv } from '../../utils/csvExport';

export const listCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).user.companyId;
    const customers = await prisma.customer.findMany({
      where: { companyId },
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.companyId;

    const customer = await prisma.customer.findUnique({
      where: { id, companyId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            lastLoginAt: true,
            lastActiveAt: true,
            createdAt: true,
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const inviteCustomerUser = async (req: Request, res: Response, next: NextFunction) => {
  let createdUserId: string | null = null;
  let createdTokenId: string | null = null;

  try {
    const { customerId } = req.params;
    const { email, firstName, lastName, role, requiresApproval, orderLimit } = req.body;
    const userPayload = (req as any).user;
    
    // DEBUG LOG
    logger.info('DEBUG: Invitation request from user', { 
      payload: userPayload,
      hasUserId: !!userPayload?.userId,
      hasId: !!userPayload?.id 
    });

    const senderId = userPayload.userId || userPayload.id; // Fallback to id if userId is missing
    const companyId = userPayload.companyId;

    if (!senderId) {
      return res.status(401).json({ success: false, error: 'User identity missing. Please re-login.' });
    }

    // Verify customer belongs to company
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, companyId },
      include: { 
        company: true,
        _count: { select: { users: true } }
      }
    });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    // 1. Authorization Check:
    // If sender is a 'customer' type, verify they are ADMIN of their own customerId.
    if (userPayload.type === 'customer') {
      if (userPayload.role !== 'ADMIN' || userPayload.customerId !== customerId) {
        return res.status(403).json({ success: false, error: 'No tienes permisos para invitar usuarios a esta cuenta.' });
      }
    }

    // 2. Limit Check:
    const currentUsers = customer._count.users;
    if (currentUsers >= customer.maxUsers) {
      return res.status(400).json({ 
        success: false, 
        error: `Has alcanzado el límite de usuarios para esta cuenta (${customer.maxUsers}). Contacta a soporte para ampliar tu cupo.` 
      });
    }

    // Check if user already exists (GLOBAL VALIDATION)
    const existingCustomerUser = await prisma.customerUser.findUnique({ where: { email } });
    if (existingCustomerUser) {
      return res.status(400).json({ 
        success: false, 
        error: `El correo ya está registrado como usuario del cliente: ${existingCustomerUser.firstName} ${existingCustomerUser.lastName}` 
      });
    }

    const existingInternalUser = await prisma.internalUser.findUnique({ where: { email } });
    if (existingInternalUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este correo pertenece a un administrador interno de la plataforma y no puede ser usado para una cuenta de cliente.' 
      });
    }

    const isNewUser = true; // Since we check both above, if we are here, it's new.
    let user;

    if (isNewUser) {
      user = await prisma.customerUser.create({
        data: {
          companyId,
          customerId,
          email,
          firstName,
          lastName,
          role: role || 'BUYER',
          requiresApproval: requiresApproval ?? (role === 'ADMIN' ? false : true),
          orderLimit: orderLimit ? parseFloat(orderLimit) : null,
          status: 'INVITED',
          passwordHash: '',
        }
      });
      createdUserId = user.id;
    }

    // Generate token (24h)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const vToken = await prisma.verificationToken.create({
      data: {
        userId: user!.id,
        token,
        type: 'INVITATION',
        expiresAt,
      }
    });
    createdTokenId = vToken.id;

    // Send Email
    const setupUrl = `${env.CLIENT_URL}/setup-account?token=${token}`;
    
    // Determine the sender. If it's a customer portal user, we must use an InternalUser (SaaS Admin) of the company that has an active EmailConfig to dispatch the notification.
    let emailSenderId = senderId;
    if (userPayload.type === 'customer') {
      const adminWithEmail = await prisma.internalUser.findFirst({
        where: { companyId, emailConfig: { isNot: null } },
        select: { id: true }
      });
      if (!adminWithEmail) {
         // Failsafe in case no email is configured, though usually seeded for demo.
         throw new Error('La empresa proveedora no tiene configurado un servidor de correo para enviar invitaciones.');
      }
      emailSenderId = adminWithEmail.id;
    }

    try {
      await EmailService.sendUserEmail(emailSenderId, {
        to: email,
        subject: `Invitación a colaborar: ${customer.company.name}`,
        html: EmailService.getInvitationTemplate({
          companyName: customer.company.name,
          companyLogo: customer.company.logo ? `${env.API_URL}/api/companies/logo/${customer.companyId}` : null,
          customerName: `${firstName} ${lastName}`,
          setupUrl,
        }),
      });
    } catch (emailError: any) {
      // ROLLBACK: Delete what we created in this request
      logger.error('Failed to send invitation email - Rolling back', { error: emailError.message });
      
      if (createdTokenId) await prisma.verificationToken.delete({ where: { id: createdTokenId } }).catch(() => {});
      if (createdUserId) await prisma.customerUser.delete({ where: { id: createdUserId } }).catch(() => {});

      return res.status(400).json({ 
        success: false, 
        error: 'No se pudo enviar el correo de invitación. La operación fue cancelada y el usuario no fue creado.',
        details: emailError.message
      });
    }

    // Audit invitation
    await logAction({
      companyId,
      userId: senderId,
      userEmail: userPayload.email,
      action: 'CUSTOMER_USER_INVITED',
      resource: 'CustomerUser',
      resourceId: user!.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { 
        customerId, 
        email, 
        role: role || 'BUYER',
        firstName,
        lastName,
        customerName: customer.name,
        newData: user
      }
    });

    res.json({ success: true, message: 'Invitación enviada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const vToken = await prisma.verificationToken.findUnique({
      where: { token, type: 'INVITATION' },
      include: { 
        user: {
          include: {
            customer: {
              include: { company: true }
            }
          }
        } 
      }
    });

    if (!vToken || !vToken.user || vToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'El enlace ha expirado o no es válido' });
    }

    res.json({ 
      success: true, 
      data: { 
        email: vToken.user.email,
        firstName: vToken.user.firstName,
        lastName: vToken.user.lastName,
        company: vToken.user.customer.company
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const setupPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const vToken = await prisma.verificationToken.findUnique({
      where: { token, type: 'INVITATION' },
      include: { user: true }
    });

    if (!vToken || !vToken.userId || vToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'El enlace ha expirado o no es válido' });
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.customerUser.update({
        where: { id: vToken.userId! },
        data: { passwordHash, status: 'ACTIVE' }
      }),
      prisma.verificationToken.delete({ where: { id: vToken.id } })
    ]);

    res.json({ success: true, message: 'Contraseña configurada con éxito' });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.companyId;
    const original = await prisma.customer.findUnique({ where: { id } });

    const { maxUsers, status, portalEnabled } = req.body;
    const updated = await prisma.customer.update({
      where: { id, companyId },
      data: {
        ...(maxUsers !== undefined && { maxUsers: Number(maxUsers) }),
        ...(status !== undefined && { status }),
        ...(portalEnabled !== undefined && { portalEnabled }),
      },
    });

    // Audit update
    await logAction({
      companyId,
      userId: (req as any).user.userId || (req as any).user.id,
      userEmail: (req as any).user.email,
      action: 'CUSTOMER_UPDATED',
      resource: 'Customer',
      resourceId: id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { 
        changedFields: Object.keys(req.body),
        oldData: original,
        newData: updated
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const listMyTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userPayload = (req as any).user;
    if (userPayload.type !== 'customer') {
      return res.status(403).json({ success: false, error: 'Solo disponible para usuarios de portal' });
    }

    const team = await prisma.customerUser.findMany({
      where: { customerId: userPayload.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const customer = await prisma.customer.findUnique({
      where: { id: userPayload.customerId },
      select: { maxUsers: true }
    });

    res.json({ 
      success: true, 
      data: team,
      meta: {
        maxUsers: customer?.maxUsers || 5,
        count: team.length
      }
    });
  } catch (error) {
    next(error);
  }
};
export const updateCustomerUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const companyId = (req as any).user.companyId;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado no válido' });
    }

    // Verify user belongs to a customer of this company
    const originUser = await prisma.customerUser.findUnique({
      where: { id: userId },
      include: { customer: true }
    });

    if (!originUser || originUser.customer.companyId !== companyId) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const { customer, ...originalData } = originUser;

    const updated = await prisma.customerUser.update({
      where: { id: userId },
      data: { status }
    });

    // Audit status update
    await logAction({
      companyId,
      userId: (req as any).user.userId || (req as any).user.id,
      userEmail: (req as any).user.email,
      action: 'CUSTOMER_USER_STATUS_UPDATED',
      resource: 'CustomerUser',
      resourceId: userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { 
        oldStatus: originalData.status,
        newStatus: status,
        userEmail: updated.email,
        oldData: originalData,
        newData: updated
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const exportCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).user.companyId;

    const customers = await prisma.customer.findMany({
      where: { companyId },
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });

    const exportData = customers.map(c => ({
      Nombre: c.name,
      CodigoInterno: c.internalCode,
      TaxId: c.taxId,
      Estado: c.status,
      PortalHabilitado: c.portalEnabled ? 'SI' : 'NO',
      MaxUsuarios: c.maxUsers,
      UsuariosActivos: c._count.users,
      FechaRegistro: c.createdAt.toISOString().split('T')[0]
    }));

    // Audit export
    await logAction({
      companyId,
      userId: (req as any).user.userId || (req as any).user.id,
      userEmail: (req as any).user.email,
      action: 'CUSTOMERS_EXPORTED',
      resource: 'Customer',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { count: exportData.length }
    });

    return exportToCsv(res, `clientes_nexob2b_${new Date().toISOString().split('T')[0]}`, exportData);
  } catch (error) {
    next(error);
  }
};
