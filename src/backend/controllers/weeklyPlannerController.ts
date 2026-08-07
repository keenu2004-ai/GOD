import { Request, Response } from 'express';
import { weeklyPlannerService } from '../services/weeklyPlannerService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class WeeklyPlannerController {
  // POST /planner/items
  async addTaskItem(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dto = {
        ...req.body,
        employee_id: user?.role === 'EMPLOYEE' ? user?.id : (req.body.employee_id || user?.id),
      };
      const data = await weeklyPlannerService.addWeeklyTaskItem(dto, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Weekly plan task item added'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /planner/items/:id/status
  async updateItemStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status, actual_hours } = req.body;
      const data = await weeklyPlannerService.updatePlanItemStatus(id, status, actual_hours);
      return res.json(sendSuccess(data, 'Plan item status updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /planner/details
  async getPlanDetails(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.id || 1);
      const week = req.query.week ? parseInt(req.query.week as string) : 32;
      const year = req.query.year ? parseInt(req.query.year as string) : 2026;

      const data = await weeklyPlannerService.getPlanDetails(empId, week, year);
      return res.json(sendSuccess(data, 'Weekly plan details retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /planner/capacity
  async getTeamCapacity(req: Request, res: Response) {
    try {
      const deptId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
      const week = req.query.week ? parseInt(req.query.week as string) : 32;
      const year = req.query.year ? parseInt(req.query.year as string) : 2026;

      const data = await weeklyPlannerService.getTeamCapacityPlan(deptId, week, year);
      return res.json(sendSuccess(data, 'Team workload capacity plan retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /planner/export/csv
  async exportCSV(req: Request, res: Response) {
    try {
      const week = req.query.week ? parseInt(req.query.week as string) : 32;
      const year = req.query.year ? parseInt(req.query.year as string) : 2026;

      const file = await weeklyPlannerService.exportScheduleCSV(week, year);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      return res.send(file.content);
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const weeklyPlannerController = new WeeklyPlannerController();
