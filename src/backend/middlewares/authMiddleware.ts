import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(sendError('Authentication token required'));
  }

  const user = verifyAccessToken(token);
  if (!user) {
    return res.status(401).json(sendError('Invalid or expired authentication token'));
  }

  (req as any).user = user;
  next();
}

export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(403).json(sendError('Insufficient permission for this HRMS resource'));
    }
    const userRole = (user.role || '').toUpperCase();
    const superRoles = ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPER_BOSS'];
    if (superRoles.includes(userRole) || roles.map(r => r.toUpperCase()).includes(userRole)) {
      return next();
    }
    return res.status(403).json(sendError('Insufficient permission for this HRMS resource'));
  };
}

