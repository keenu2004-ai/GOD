import { Request, Response } from 'express';
import { projectAnalyticsService } from '../services/projectAnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ProjectAnalyticsController {
  // GET /projects/portfolio/kpis
  async getKPIs(req: Request, res: Response) {
    try {
      const data = await projectAnalyticsService.getPortfolioKPIs();
      return res.json(sendSuccess(data, 'Portfolio BI KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /projects/milestones
  async createMilestone(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await projectAnalyticsService.createMilestone(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Project milestone created'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects/milestones
  async getMilestones(req: Request, res: Response) {
    try {
      const prjId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const data = await projectAnalyticsService.getMilestones(prjId);
      return res.json(sendSuccess(data, 'Project milestones retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /projects/risks
  async createRisk(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await projectAnalyticsService.createRisk(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Project risk logged in register'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /projects/risks
  async getRisks(req: Request, res: Response) {
    try {
      const prjId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const data = await projectAnalyticsService.getRisks(prjId);
      return res.json(sendSuccess(data, 'Project risk register retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const projectAnalyticsController = new ProjectAnalyticsController();
