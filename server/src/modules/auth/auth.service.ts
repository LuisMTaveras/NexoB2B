import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import type { RegisterDto, LoginDto, UpdateProfileDto, UpdatePasswordDto } from './auth.schemas';

function signTokens(payload: { userId: string; companyId: string; customerId?: string; email: string; role: string; type: 'internal' | 'customer' }) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  const refreshToken = jwt.sign({ userId: payload.userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
  return { accessToken, refreshToken };
}

export async function registerCompany(data: RegisterDto) {
  // Check slug uniqueness
  const existing = await prisma.company.findUnique({ where: { slug: data.companySlug } });
  if (existing) throw new AppError('Company slug already taken', 409);

  const hashedPassword = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  // Get the global ADMIN role
  const adminRole = await prisma.role.findFirst({
    where: { companyId: null, name: 'ADMIN' },
  });

  if (!adminRole) throw new AppError('System Roles not initialized. Please run seed.', 500);

  const company = await prisma.company.create({
    data: {
      name: data.companyName,
      slug: data.companySlug,
      status: 'ACTIVE',
      internalUsers: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash: hashedPassword,
          roleId: adminRole.id,
          status: 'ACTIVE',
        },
      },
    },
    include: { internalUsers: { include: { role: true } } },
  });

  const user = company.internalUsers[0];
  const tokens = signTokens({
    userId: user.id,
    companyId: company.id,
    email: user.email,
    role: user.role?.name || 'ADMIN',
    type: 'internal',
  });

  return { company, user, ...tokens };
}

export async function login(data: LoginDto) {
  const email = data.email.trim().toLowerCase();
  logger.info(`DEBUG: Intentando login para: [${email}]`);

  // 1. Try Internal User
  let internalUser = await prisma.internalUser.findUnique({
    where: { email },
    include: { company: true, role: true },
  });

  if (internalUser) {
    if (internalUser.status !== 'ACTIVE') throw new AppError('Account is not active', 403);
    if (internalUser.company.status !== 'ACTIVE') throw new AppError('Company account suspended', 403);

    const valid = await bcrypt.compare(data.password, internalUser.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const tokens = signTokens({
      userId: internalUser.id,
      companyId: internalUser.companyId,
      email: internalUser.email,
      role: internalUser.role?.name || 'ADMIN',
      type: 'internal',
    });

    await prisma.internalUser.update({
      where: { id: internalUser.id },
      data: { lastLoginAt: new Date(), lastActiveAt: new Date() }
    });

    return { 
      user: internalUser, 
      company: internalUser.company, 
      type: 'internal' as const,
      ...tokens 
    };
  }

  // 2. Try Customer User
  const customerUser = await prisma.customerUser.findUnique({
    where: { email },
    include: {
      customer: { include: { company: true } }
    }
  });

  if (customerUser) {
    if (customerUser.status === 'INACTIVE') throw new AppError('Tu cuenta ha sido desactivada. Contacta al administrador.', 403);
    if (customerUser.status === 'INVITED') throw new AppError('Tu cuenta está pendiente de configuración. Revisa tu correo.', 403);
    if (customerUser.customer.status !== 'ACTIVE') throw new AppError('La cuenta de cliente está inactiva.', 403);
    if (customerUser.customer.company.status !== 'ACTIVE') throw new AppError('El acceso a la plataforma para esta empresa ha sido suspendido.', 403);
    if (!customerUser.customer.portalEnabled) throw new AppError('El acceso al portal B2B se encuentra deshabilitado para esta cuenta corporativa.', 403);

    const valid = await bcrypt.compare(data.password, customerUser.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const tokens = signTokens({
      userId: customerUser.id,
      companyId: customerUser.customer.companyId,
      customerId: customerUser.customerId,
      email: customerUser.email,
      role: customerUser.role,
      type: 'customer',
    });

    await prisma.customerUser.update({
      where: { id: customerUser.id },
      data: { lastLoginAt: new Date(), lastActiveAt: new Date() }
    });

    return {
      user: {
        ...customerUser,
        customerName: customerUser.customer.name
      },
      company: customerUser.customer.company,
      type: 'customer' as const,
      ...tokens
    };
  }

  throw new AppError('Invalid credentials', 401);
}

export async function getMe(userId: string, type: 'internal' | 'customer') {
  if (type === 'internal') {
    const user = await prisma.internalUser.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, email: true, status: true,
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        },
        company: { select: { id: true, name: true, slug: true, logo: true, status: true } },
      },
    });
    
    if (!user) return null;

    const permissions = user.role?.permissions.map(p => p.permission.code) || [];

    return { 
      ...user, 
      type: 'internal',
      roleName: user.role?.name || 'NONE',
      permissions 
    };
  }

  const customerUser = await prisma.customerUser.findUnique({
    where: { id: userId },
    include: {
      customer: {
        include: { company: true }
      }
    }
  });

  if (!customerUser) return null;

  return {
    id: customerUser.id,
    firstName: customerUser.firstName,
    lastName: customerUser.lastName,
    email: customerUser.email,
    role: customerUser.role,
    status: customerUser.status,
    type: 'customer',
    company: customerUser.customer.company, // This is the SaaS provider
    customerId: customerUser.customerId,    // Added missing customerId
    customerName: customerUser.customer.name, // This is the user's actual company
    permissions: [] // Currently customers don't have granular permissions
  };
}

export async function updateProfile(userId: string, data: UpdateProfileDto) {
  // Check if they are internal user (for now we assume internal users are editing their profile from admin panel)
  const user = await prisma.internalUser.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // If email changes, make sure it is not taken
  if (data.email !== user.email) {
    const existing = await prisma.internalUser.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already in use', 409);
  }

  const updatedUser = await prisma.internalUser.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    },
    select: {
      id: true, firstName: true, lastName: true, email: true, role: true, status: true,
      company: { select: { id: true, name: true, slug: true, logo: true, status: true } },
    },
  });

  return { ...updatedUser, type: 'internal' };
}

export async function updatePassword(userId: string, data: UpdatePasswordDto) {
  const user = await prisma.internalUser.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  const hashedNewPassword = await bcrypt.hash(data.newPassword, env.BCRYPT_ROUNDS);

  await prisma.internalUser.update({
    where: { id: userId },
    data: { passwordHash: hashedNewPassword },
  });

  return { success: true };
}
export async function verifyInvitation(token: string) {
  const vToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: {
      user: { include: { customer: { include: { company: true } } } },
      internalUser: { include: { company: true } }
    }
  });

  if (!vToken) throw new AppError('Token de invitación inválido o expirado', 404);
  if (vToken.expiresAt < new Date()) {
    throw new AppError('El enlace de invitación ha expirado', 400);
  }

  const user = vToken.internalUser || vToken.user;
  if (!user) throw new AppError('Usuario asociado al token no encontrado', 404);

  const company = vToken.internalUser ? vToken.internalUser.company : vToken.user?.customer.company;

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    company: {
      id: company?.id,
      name: company?.name,
      logo: company?.logo
    },
    type: vToken.internalUserId ? 'internal' : 'customer'
  };
}

export async function setupInvitationAccount(token: string, password: string) {
  const vToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: {
      user: true,
      internalUser: true
    }
  });

  if (!vToken) throw new AppError('Token de invitación no válido', 404);
  if (vToken.expiresAt < new Date()) throw new AppError('El enlace ha expirado', 400);

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  if (vToken.internalUserId) {
    await prisma.internalUser.update({
      where: { id: vToken.internalUserId },
      data: {
        passwordHash: hashedPassword,
        status: 'ACTIVE'
      }
    });
  } else if (vToken.userId) {
    await prisma.customerUser.update({
      where: { id: vToken.userId },
      data: {
        passwordHash: hashedPassword,
        status: 'ACTIVE'
      }
    });
  }

  // Delete the token
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true };
}
