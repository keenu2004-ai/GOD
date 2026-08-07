import { Request, Response } from 'express';
import { enterpriseProjectService } from '../services/enterpriseProjectService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class EnterpriseProjectController {
  // POST /projects/seed
  async seedCategories(req: Request, res: Response) {
    try {
      await enterpriseProjectService.seedCategoriesAndClients();
      return res.json(sendSuccess(null, 'Standard project categories pre-seeded'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /projects
  async createProject(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await enterpriseProjectService.createProject(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Enterprise project created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects
  async getProjects(req: Request, res: Response) {
    try {
      const status = req.query.status as string;
      const data = await enterpriseProjectService.getProjects(status);
      return res.json(sendSuccess(data, 'Projects retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /projects/:id/workspace
  async getProjectWorkspace(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await enterpriseProjectService.getProjectDetails(id);
      if (!data) return res.status(404).json(sendError('Project workspace not found'));
      return res.json(sendSuccess(data, 'Project workspace details retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /projects/members
  async addMember(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await enterpriseProjectService.addMember(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Team member assigned to project'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // DELETE /projects/:id/members/:employeeId
  async removeMember(req: Request, res: Response) {
    try {
      const projId = parseInt(req.params.id);
      const empId = parseInt(req.params.employeeId);
      await enterpriseProjectService.removeMember(projId, empId);
      return res.json(sendSuccess(null, 'Member removed from project'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /projects/documents
  async addDocument(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await enterpriseProjectService.addDocument(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Project document uploaded'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /projects/notes
  async createNote(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await enterpriseProjectService.createNote(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Project note / meeting minutes created'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects/analytics/kpis
  async getKPIs(req: Request, res: Response) {
    try {
      const data = await enterpriseProjectService.getProjectDashboardKPIs();
      return res.json(sendSuccess(data, 'Portfolio BI KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const enterpriseProjectController = new EnterpriseProjectController();
