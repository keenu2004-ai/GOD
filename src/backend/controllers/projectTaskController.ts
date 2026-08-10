import { Request, Response } from 'express';
import { projectTaskService } from '../services/projectTaskService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ProjectTaskController {
  // POST /tasks/daily-standups
  async submitDailyStandup(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { standup_date, yesterday_work, today_plan, blockers, notes } = req.body;
      if (!standup_date || !yesterday_work || !today_plan) {
        throw new Error('Date, yesterday\'s work, and today\'s plan are required');
      }
      const data = await projectTaskService.submitDailyStandup(
        user?.id || 1, standup_date, yesterday_work, today_plan, blockers || null, notes || null
      );
      return res.status(201).json(sendSuccess(data, 'Daily standup report submitted successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /tasks/daily-standups
  async getDailyStandups(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { date, employeeId } = req.query;
      const filters: any = {};
      
      // If employee, only get own standups. If manager, can filter
      if (user?.role === 'EMPLOYEE') {
        filters.employee_id = user.id;
      } else if (employeeId) {
        filters.employee_id = parseInt(employeeId as string);
      }
      
      if (date) {
        filters.standup_date = date as string;
      }
      
      const data = await projectTaskService.getDailyStandups(filters);
      return res.json(sendSuccess(data, 'Daily standups retrieved successfully'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const projectTaskController = new ProjectTaskController();
