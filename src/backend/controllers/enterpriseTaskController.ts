import { Request, Response } from 'express';
import { enterpriseTaskService } from '../services/enterpriseTaskService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class EnterpriseTaskController {
  // POST /tasks/sprints
  async createSprint(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await enterpriseTaskService.createSprint(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Sprint created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /tasks/sprints
  async getSprints(req: Request, res: Response) {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const data = await enterpriseTaskService.getSprints(projectId);
      return res.json(sendSuccess(data, 'Sprints retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /tasks
  async createTask(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await enterpriseTaskService.createTask(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Task created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /tasks/:id/status
  async updateTaskStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const status = req.body.status;
      const data = await enterpriseTaskService.updateTaskStatus(id, status, user?.id || 1);
      return res.json(sendSuccess(data, 'Task status updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /tasks
  async getTasks(req: Request, res: Response) {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
      const status = req.query.status as string;
      const assigneeId = req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined;

      const data = await enterpriseTaskService.getTasks(projectId, sprintId, status, assigneeId);
      return res.json(sendSuccess(data, 'Tasks retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /tasks/:id/checklist
  async addChecklistItem(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const itemText = req.body.item_text;
      const data = await enterpriseTaskService.addChecklistItem(id, itemText);
      return res.status(201).json(sendSuccess(data, 'Checklist item added'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /tasks/checklist/:itemId/toggle
  async toggleChecklistItem(req: Request, res: Response) {
    try {
      const itemId = parseInt(req.params.itemId);
      const data = await enterpriseTaskService.toggleChecklistItem(itemId);
      return res.json(sendSuccess(data, 'Checklist item toggled'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const enterpriseTaskController = new EnterpriseTaskController();
