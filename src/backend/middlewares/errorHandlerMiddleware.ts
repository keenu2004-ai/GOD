import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorHandlerMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`API Error [${req.method} ${req.url}]: ${message}`, {
    statusCode,
    path: req.originalUrl,
    ip: req.ip,
    user: (req as any).user?.id,
  });

  return res.status(statusCode).json(sendError(message));
}
