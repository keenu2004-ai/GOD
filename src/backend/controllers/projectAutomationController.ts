import { Request, Response } from 'express';
import { projectAutomationService } from '../services/projectAutomationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ProjectAutomationController {
  // POST /projects/automation/check-deadlines
  async checkDeadlines(req: Request, res: Response) {
    try {
      const data = await projectAutomationService.checkAndNotifyTaskDeadlines();
      return res.json(sendSuccess(data, 'Automated deadline check completed'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /projects/:id/recalculate-health
  async recalculateHealth(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await projectAutomationService.recalculateProjectHealth(id);
      return res.json(sendSuccess(data, 'Project health recalculated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /tasks/bulk-update
  async bulkUpdate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await projectAutomationService.bulkUpdateTasks(req.body, user?.id || 1);
      return res.json(sendSuccess(data, 'Tasks updated in bulk'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects/search
  async globalSearch(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || '';
      const user = (req as any).user;
      const data = await projectAutomationService.globalSearch(q, user?.id);
      return res.json(sendSuccess(data, 'Global search results retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const projectAutomationController = new ProjectAutomationController();
