import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import type { RegisterDto, LoginDto, UpdateProfileDto, UpdatePasswordDto } from './auth.schemas';

function signTokens(payload: { userId: string; companyId: string; email: string; role: string; type: 'internal' | 'customer' }) {
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
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      },
    },
    include: { internalUsers: true },
  });

  const user = company.internalUsers[0];
  const tokens = signTokens({
    userId: user.id,
    companyId: company.id,
    email: user.email,
    role: user.role,
    type: 'internal',
  });

  return { company, user, ...tokens };
}

export async function loginInternal(data: LoginDto) {
  const user = await prisma.internalUser.findUnique({
    where: { email: data.email },
    include: { company: true },
  });

  if (!user) throw new AppError('Invalid credentials', 401);
  if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);
  if (user.company.status !== 'ACTIVE') throw new AppError('Company account suspended', 403);

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const tokens = signTokens({
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
    type: 'internal',
  });

  return { user, company: user.company, ...tokens };
}

export async function getMe(userId: string, type: 'internal' | 'customer') {
  if (type === 'internal') {
    return prisma.internalUser.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true, status: true,
        company: { select: { id: true, name: true, slug: true, logo: true, status: true } },
      },
    });
  }
  return prisma.customerUser.findUnique({
    where: { id: userId },
    select: {
      id: true, firstName: true, lastName: true, email: true, role: true, status: true,
      customer: { select: { id: true, name: true, companyId: true } },
    },
  });
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

  return updatedUser;
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
