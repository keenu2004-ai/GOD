import { Request, Response } from 'express';
import { leaveAnalyticsService } from '../services/leaveAnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LeaveAnalyticsController {
  // GET /analytics/leave/kpis
  async getKPIs(req: Request, res: Response) {
    try {
      const data = await leaveAnalyticsService.getExecutiveKPIs();
      return res.json(sendSuccess(data, 'Executive leave KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/trend
  async getTrend(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = await leaveAnalyticsService.getMonthlyLeaveTrend(year);
      return res.json(sendSuccess(data, 'Monthly leave trend retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/departments
  async getDepartments(req: Request, res: Response) {
    try {
      const data = await leaveAnalyticsService.getDepartmentLeaveAnalytics();
      return res.json(sendSuccess(data, 'Department leave analytics retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/branches
  async getBranches(req: Request, res: Response) {
    try {
      const data = await leaveAnalyticsService.getBranchLeaveAnalytics();
      return res.json(sendSuccess(data, 'Branch leave analytics retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/heatmap
  async getHeatmap(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const data = await leaveAnalyticsService.getLeaveHeatmap(year, month);
      return res.json(sendSuccess(data, 'Leave heatmap retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/forecast
  async getForecast(req: Request, res: Response) {
    try {
      const data = await leaveAnalyticsService.getLeaveForecast();
      return res.json(sendSuccess(data, 'Leave load forecast retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /analytics/leave/log-export
  async logExport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { report_type, filename } = req.body;
      await leaveAnalyticsService.logReportExport(user?.id || 1, report_type, filename);
      return res.json(sendSuccess(null, 'Export logged'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const leaveAnalyticsController = new LeaveAnalyticsController();
