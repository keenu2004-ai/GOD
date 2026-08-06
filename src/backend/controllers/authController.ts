import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json(sendError('Email and password are required'));
      }
      const result = await authService.login(email, password);
      return res.json(sendSuccess(result, 'Login successful'));
    } catch (error: any) {
      return res.status(401).json(sendError(error.message || 'Authentication failed'));
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json(sendError('Refresh token required'));
      }
      const tokens = await authService.refreshToken(refreshToken);
      return res.json(sendSuccess(tokens, 'Token refreshed'));
    } catch (error: any) {
      return res.status(401).json(sendError(error.message || 'Invalid refresh token'));
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json(sendError('Unauthorized'));
      const profile = await authService.getProfile(userId);
      return res.json(sendSuccess(profile, 'Profile retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const authController = new AuthController();
