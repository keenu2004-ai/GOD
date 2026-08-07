import { Request, Response } from 'express';
import { attendanceFinalizationService } from '../services/attendanceFinalizationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AttendanceFinalizationController {
  // GET /attendance/health-score
  async getHealthScore(req: Request, res: Response) {
    try {
      const data = await attendanceFinalizationService.getHealthScore(
        req.query.startDate as string,
        req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Attendance Health Score retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /attendance/integrations/weekly-planner?date=2026-08-07
  async getWeeklyPlanner(req: Request, res: Response) {
    try {
      const dateStr = req.query.date as string;
      const data = await attendanceFinalizationService.getWeeklyPlannerIntegration(dateStr);
      return res.json(sendSuccess(data, 'Weekly Planner attendance integration data retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /attendance/integrations/org-chart
  async getOrgChart(req: Request, res: Response) {
    try {
      const data = await attendanceFinalizationService.getOrgChartIntegration();
      return res.json(sendSuccess(data, 'Org Chart live attendance overlay retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /attendance/integrations/dashboard-feed
  async getDashboardFeed(req: Request, res: Response) {
    try {
      const data = await attendanceFinalizationService.getDashboardFeed();
      return res.json(sendSuccess(data, 'Live dashboard attendance feed retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /attendance/log-event
  async logEvent(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { event, details } = req.body;
      await attendanceFinalizationService.logEvent(user?.id, event, details);
      return res.json(sendSuccess(null, 'Event logged'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const attendanceFinalizationController = new AttendanceFinalizationController();
