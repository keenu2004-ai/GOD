import { Request, Response } from 'express';
import { timeTrackingService } from '../services/timeTrackingService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class TimeTrackingController {
  // POST /timetracking/timer/start
  async startTimer(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { project_id, task_id } = req.body;
      const data = await timeTrackingService.startTimer(user?.id || 1, project_id, task_id);
      return res.status(201).json(sendSuccess(data, 'Live work session timer started'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /timetracking/timer/stop
  async stopTimer(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { description } = req.body;
      const data = await timeTrackingService.stopTimer(user?.id || 1, description);
      return res.json(sendSuccess(data, 'Work timer stopped and time entry recorded'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /timetracking/timer/active
  async getActiveTimer(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await timeTrackingService.getActiveTimer(user?.id || 1);
      return res.json(sendSuccess(data, 'Active timer retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /timetracking/entry
  async logTimeEntry(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dto = { ...req.body, employee_id: user?.role === 'EMPLOYEE' ? user?.id : (req.body.employee_id || user?.id) };
      const data = await timeTrackingService.logTimeEntry(dto);
      return res.status(201).json(sendSuccess(data, 'Manual time entry logged'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /timetracking/timesheet
  async getTimesheet(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.id || 1);
      const startDate = (req.query.startDate as string) || '2026-08-01';
      const endDate = (req.query.endDate as string) || '2026-08-31';

      const data = await timeTrackingService.getTimesheetEntries(empId, startDate, endDate);
      return res.json(sendSuccess(data, 'Timesheet entries retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /timetracking/timesheet/submit
  async submitTimesheet(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { week_number, year, total_hours, billable_hours } = req.body;
      const data = await timeTrackingService.submitTimesheet(user?.id || 1, week_number || 32, year || 2026, total_hours, billable_hours);
      return res.status(201).json(sendSuccess(data, 'Weekly timesheet submitted for manager approval'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /timetracking/timesheet/:id/approve
  async approveTimesheet(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await timeTrackingService.approveTimesheet(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Timesheet approved by manager'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /timetracking/timesheets/pending
  async getPendingTimesheets(req: Request, res: Response) {
    try {
      const data = await timeTrackingService.getPendingTimesheets();
      return res.json(sendSuccess(data, 'Pending timesheets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /timetracking/analytics/kpis
  async getKPIs(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await timeTrackingService.getProductivityKPIs(empId);
      return res.json(sendSuccess(data, 'Productivity KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const timeTrackingController = new TimeTrackingController();
