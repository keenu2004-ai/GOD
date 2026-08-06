import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';

export interface ApiResponseHandler extends Response {
  success: (data: any, message?: string, statusCode?: number) => Response;
  error: (message: string, statusCode?: number) => Response;
}

export function responseHandlerMiddleware(req: Request, res: Response, next: NextFunction) {
  (res as any).success = function (data: any, message = 'Operation successful', statusCode = 200) {
    return res.status(statusCode).json(sendSuccess(data, message));
  };

  (res as any).error = function (message = 'Operation failed', statusCode = 400) {
    return res.status(statusCode).json(sendError(message));
  };

  next();
}
