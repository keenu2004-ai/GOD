import { Request, Response } from 'express';
import { taskCollaborationService } from '../services/taskCollaborationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class TaskCollaborationController {
  // POST /tasks/daily-reports
  async submitReport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dto = { ...req.body, employee_id: user?.role === 'EMPLOYEE' ? user?.id : (req.body.employee_id || user?.id) };
      const data = await taskCollaborationService.submitDailyReport(dto);
      return res.status(201).json(sendSuccess(data, 'Daily work report submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /tasks/daily-reports/:id/review
  async reviewReport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { status, feedback } = req.body;
      const data = await taskCollaborationService.reviewDailyReport(id, status, feedback, user?.id || 1);
      return res.json(sendSuccess(data, `Daily report ${status.toLowerCase()}`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /tasks/daily-reports
  async getReports(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const date = req.query.date as string;
      const data = await taskCollaborationService.getDailyReports(empId, date);
      return res.json(sendSuccess(data, 'Daily work reports retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /tasks/:id/comments
  async addComment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const commentText = req.body.comment_text;
      const data = await taskCollaborationService.addComment(id, commentText, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Comment added to task'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /tasks/:id/comments
  async getComments(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await taskCollaborationService.getComments(id);
      return res.json(sendSuccess(data, 'Task comments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /tasks/:id/activity
  async getActivity(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await taskCollaborationService.getActivityFeed(id);
      return res.json(sendSuccess(data, 'Task activity feed retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const taskCollaborationController = new TaskCollaborationController();
