import { Request, Response } from 'express';
import { clientPortalService } from '../services/clientPortalService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ClientPortalController {
  // POST /client/organizations
  async createOrganization(req: Request, res: Response) {
    try {
      const data = await clientPortalService.createClientOrganization(req.body);
      return res.status(201).json(sendSuccess(data, 'Client organization created'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /client/access/grant
  async grantAccess(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { client_org_id, project_id, access_level } = req.body;
      const data = await clientPortalService.grantProjectAccess(client_org_id, project_id, access_level, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Project access granted to client'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /client/projects
  async getClientProjects(req: Request, res: Response) {
    try {
      const clientOrgId = req.query.clientOrgId ? parseInt(req.query.clientOrgId as string) : undefined;
      const data = await clientPortalService.getClientProjects(clientOrgId);
      return res.json(sendSuccess(data, 'Client shared projects retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /client/deliverables
  async createDeliverable(req: Request, res: Response) {
    try {
      const data = await clientPortalService.createDeliverable(req.body);
      return res.status(201).json(sendSuccess(data, 'Project deliverable submitted for review'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /client/deliverables
  async getDeliverables(req: Request, res: Response) {
    try {
      const prjId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const data = await clientPortalService.getDeliverables(prjId);
      return res.json(sendSuccess(data, 'Project deliverables retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /client/deliverables/:id/review
  async reviewDeliverable(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = (req as any).user;
      const { status, client_comments } = req.body;
      const data = await clientPortalService.reviewDeliverable(id, status, client_comments, user?.id);
      return res.json(sendSuccess(data, `Deliverable ${status.toLowerCase()}`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /client/change-requests
  async createChangeRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await clientPortalService.createChangeRequest(req.body, user?.id);
      return res.status(201).json(sendSuccess(data, 'Change request submitted successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /client/change-requests
  async getChangeRequests(req: Request, res: Response) {
    try {
      const prjId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const data = await clientPortalService.getChangeRequests(prjId);
      return res.json(sendSuccess(data, 'Change requests retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const clientPortalController = new ClientPortalController();
