import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import * as authService from './auth.service';
import { logAction } from '../../lib/audit';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerCompany(req.body);
  return sendCreated(res, {
    company: result.company,
    user: { id: result.user.id, email: result.user.email, role: result.user.role },
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }, 'Company registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  // Audit login
  await logAction({
    companyId: result.company.id,
    userId: result.user.id,
    userEmail: result.user.email,
    action: 'USER_LOGIN',
    resource: 'Auth',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: { type: result.type }
  });

  return sendSuccess(res, {
    user: { 
      id: result.user.id, 
      email: result.user.email, 
      role: result.user.role, 
      firstName: result.user.firstName, 
      lastName: result.user.lastName,
      type: result.type 
    },
    company: result.company,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }, 'Login successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId, req.user!.type);
  return sendSuccess(res, user);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear the lastActiveAt explicitly so the user disappears from online lists immediately
  if (req.user!.type === 'internal') {
    await prisma.internalUser.update({ where: { id: req.user!.userId }, data: { lastActiveAt: null } });
  } else {
    await prisma.customerUser.update({ where: { id: req.user!.userId }, data: { lastActiveAt: null } });
  }
  return sendSuccess(res, null, 'Logged out successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const original = await (prisma as any).internalUser.findUnique({ where: { id: req.user!.userId } });
  const updatedUser = await authService.updateProfile(req.user!.userId, req.body);

  // Audit profile update
  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'USER_PROFILE_UPDATED',
    resource: 'Auth',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: { 
      oldData: original ? { firstName: original.firstName, lastName: original.lastName, email: original.email } : null,
      newData: { firstName: updatedUser.firstName, lastName: updatedUser.lastName, email: updatedUser.email }
    }
  });

  return sendSuccess(res, updatedUser, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.updatePassword(req.user!.userId, req.body);

  // Audit password change
  await logAction({
    companyId: req.companyId!,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'USER_PASSWORD_CHANGED',
    resource: 'Auth',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: { message: 'Contraseña actualizada por el usuario' }
  });

  return sendSuccess(res, null, 'Password changed successfully');
});
export const verifyInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const result = await authService.verifyInvitation(token);
  return sendSuccess(res, result);
});

export const setupAccount = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const result = await authService.setupInvitationAccount(token, password);
  return sendSuccess(res, result, 'Cuenta activada exitosamente');
});
