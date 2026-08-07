import { Request, Response } from 'express';
import { dashboardService } from '../services/miscServices.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class DashboardController {
  async getMetrics(req: Request, res: Response) {
    try {
      const data = await dashboardService.getMetrics();
      return res.json(sendSuccess(data, 'Metrics retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getActivity(req: Request, res: Response) {
    try {
      const data = await dashboardService.getActivity();
      return res.json(sendSuccess(data, 'Recent activity retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getDepartments(req: Request, res: Response) {
    try {
      const data = await dashboardService.getDepartmentDistribution();
      return res.json(sendSuccess(data, 'Department distribution retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getPayrollSummary(req: Request, res: Response) {
    try {
      const data = await dashboardService.getPayrollSummary();
      return res.json(sendSuccess(data, 'Payroll summary retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getAnnouncements(req: Request, res: Response) {
    try {
      const data = await dashboardService.getAnnouncements();
      return res.json(sendSuccess(data, 'Announcements retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getCelebrations(req: Request, res: Response) {
    try {
      const data = await dashboardService.getCelebrations();
      return res.json(sendSuccess(data, 'Celebrations retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getCalendar(req: Request, res: Response) {
    try {
      const data = await dashboardService.getCalendarEvents();
      return res.json(sendSuccess(data, 'Calendar events retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getPreferences(req: Request, res: Response) {
    try {
      const empId = (req as any).user?.id || 1;
      const data = await dashboardService.getUserPreferences(empId);
      return res.json(sendSuccess(data, 'Preferences retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async updatePreferences(req: Request, res: Response) {
    try {
      const empId = (req as any).user?.id || 1;
      const { theme, default_tab } = req.body;
      const data = await dashboardService.updateUserPreferences(empId, theme || 'light', default_tab || 'dashboard');
      return res.json(sendSuccess(data, 'Preferences updated'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }
}

export const dashboardController = new DashboardController();
