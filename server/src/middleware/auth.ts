import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendUnauthorized, sendForbidden } from '../utils/apiResponse';

export interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  type: 'internal' | 'customer';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      companyId?: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    req.companyId = payload.companyId;
    next();
  } catch {
    return sendUnauthorized(res, 'Invalid or expired token');
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return sendUnauthorized(res);
    if (!roles.includes(req.user.role)) return sendForbidden(res, 'Insufficient permissions');
    next();
  };
}

export function requireInternalUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return sendUnauthorized(res);
  if (req.user.type !== 'internal') return sendForbidden(res, 'Internal users only');
  next();
}

export function requireCustomerUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return sendUnauthorized(res);
  if (req.user.type !== 'customer') return sendForbidden(res, 'Customer users only');
  next();
}
