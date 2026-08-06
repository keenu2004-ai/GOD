import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export type ValidationRule = (req: Request) => string | null;

export function validateRequest(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const rule of rules) {
      const errorMsg = rule(req);
      if (errorMsg) {
        return res.status(400).json(sendError(errorMsg));
      }
    }
    next();
  };
}
