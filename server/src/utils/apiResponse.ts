import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: Record<string, unknown>,
) {
  const response: ApiResponse<T> = { success: true, data, message, meta };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

export function sendError(res: Response, error: string, statusCode = 400) {
  const response: ApiResponse = { success: false, error };
  return res.status(statusCode).json(response);
}

export function sendNotFound(res: Response, message = 'Resource not found') {
  return sendError(res, message, 404);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized') {
  return sendError(res, message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden') {
  return sendError(res, message, 403);
}
