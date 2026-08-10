import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, employee_code, identifier, password } = req.body;
      const targetId = identifier || email || employee_code;

      if (!targetId || !password) {
        return res.status(400).json(sendError('Corporate email or employee code and password are required'));
      }

      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Browser';

      const result = await authService.login(targetId, password, ip, userAgent);
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

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        return res.status(400).json(sendError('Old password and new password are required'));
      }

      const result = await authService.changePassword(userId, old_password, new_password);
      return res.json(sendSuccess(result, 'Password updated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { employee_id, new_password } = req.body;
      if (!employee_id || !new_password) {
        return res.status(400).json(sendError('Employee ID and new password are required'));
      }
      const result = await authService.resetPassword(Number(employee_id), new_password);
      return res.json(sendSuccess(result, 'Password reset successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
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

  async getLoginHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const history = await authService.getLoginHistory(userId);
      return res.json(sendSuccess(history, 'Login history retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getRolesAndPermissions(req: Request, res: Response) {
    try {
      const data = await authService.getRolesAndPermissions();
      return res.json(sendSuccess(data, 'Roles and permissions matrix retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async updateRolePermissions(req: Request, res: Response) {
    try {
      const { role, permissions } = req.body;
      const result = await authService.updateRolePermissions(role, permissions || []);
      return res.json(sendSuccess(result, 'Role permissions updated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      return res.json(sendSuccess(result, 'Logged out successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { emailOrCode } = req.body;
      if (!emailOrCode) {
        return res.status(400).json(sendError('Email address or Employee Code is required'));
      }
      const result = await authService.forgotPassword(emailOrCode);
      return res.json(sendSuccess(result, 'Reset instructions processed'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async resetPasswordByToken(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json(sendError('Reset token and new password are required'));
      }
      const result = await authService.resetPasswordByToken(token, newPassword);
      return res.json(sendSuccess(result, 'Password has been reset successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const authController = new AuthController();
