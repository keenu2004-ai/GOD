import { Request, Response } from 'express';
import { projectTaskService } from '../services/projectTaskService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ProjectTaskController {
  // POST /projects/create
  async createProject(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await projectTaskService.createProject(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Project created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects/all
  async getProjects(req: Request, res: Response) {
    try {
      const data = await projectTaskService.getProjects();
      return res.json(sendSuccess(data, 'Projects portfolio retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /projects/tasks/create
  async createTask(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await projectTaskService.createTask(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Task created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects/tasks/all
  async getTasks(req: Request, res: Response) {
    try {
      const projectId = req.query.project_id ? parseInt(req.query.project_id as string) : undefined;
      const data = await projectTaskService.getTasks(projectId);
      return res.json(sendSuccess(data, 'Project tasks retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /projects/tasks/:id/status
  async updateTaskStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const taskId = parseInt(req.params.id);
      const { status } = req.body;
      const data = await projectTaskService.updateTaskStatus(taskId, status, user?.role || 'EMPLOYEE');
      return res.json(sendSuccess(data, 'Task status updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /projects/tasks/:id/work-update
  async submitWorkUpdate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const taskId = parseInt(req.params.id);
      const { work_completed, hours_worked, progress_pct, blockers } = req.body;
      const data = await projectTaskService.submitWorkUpdate(
        taskId, user?.id || 1, work_completed, parseFloat(hours_worked), parseInt(progress_pct), blockers
      );
      return res.status(201).json(sendSuccess(data, 'Work update submitted & progress updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects/tasks/:id/work-updates
  async getWorkUpdates(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const data = await projectTaskService.getWorkUpdates(taskId);
      return res.json(sendSuccess(data, 'Work updates retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

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
      const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(user?.role);
      
      let employeeId: number | undefined = undefined;
      
      if (!isManager) {
        employeeId = user?.id || 1;
      } else if (req.query.employeeId) {
        employeeId = parseInt(req.query.employeeId as string, 10);
      }
      
      const date = req.query.date as string;
      const data = await projectTaskService.getDailyStandups(employeeId, date);
      return res.json(sendSuccess(data, 'Daily standups retrieved successfully'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const projectTaskController = new ProjectTaskController();
