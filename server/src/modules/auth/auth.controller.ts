import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import * as authService from './auth.service';

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

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const updatedUser = await authService.updateProfile(req.user!.userId, req.body);
  return sendSuccess(res, updatedUser, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.updatePassword(req.user!.userId, req.body);
  return sendSuccess(res, null, 'Password changed successfully');
});
