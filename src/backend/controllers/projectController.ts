import { Request, Response } from 'express';
import { projectService } from '../services/miscServices.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ProjectController {
  async getAll(req: Request, res: Response) {
    try {
      const data = await projectService.getAllProjects();
      return res.json(sendSuccess(data, 'Projects list retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await projectService.getProjectDetails(id);
      return res.json(sendSuccess(data, 'Project details retrieved'));
    } catch (error: any) {
      return res.status(404).json(sendError(error.message));
    }
  }

  async createProject(req: Request, res: Response) {
    try {
      const data = await projectService.createProject(req.body);
      return res.status(201).json(sendSuccess(data, 'Project created successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async createTask(req: Request, res: Response) {
    try {
      const data = await projectService.createTask(req.body);
      return res.status(201).json(sendSuccess(data, 'Task created successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async updateTaskStatus(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const { status } = req.body;
      const data = await projectService.updateTaskStatus(taskId, status);
      return res.json(sendSuccess(data, 'Task status updated'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const projectController = new ProjectController();
