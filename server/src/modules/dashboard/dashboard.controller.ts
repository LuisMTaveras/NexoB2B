import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as dashboardService from './dashboard.service';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const data = await dashboardService.getDashboardData(companyId);
  return sendSuccess(res, data);
});

export const getOnlineUsers = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const data = await dashboardService.getOnlineUsers(companyId);
  return sendSuccess(res, data);
});
