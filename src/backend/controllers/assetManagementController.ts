import { Request, Response } from 'express';
import { assetManagementService } from '../services/assetManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AssetManagementController {
  // GET /assets/kpis
  async getKPIs(req: Request, res: Response) {
    try {
      const data = await assetManagementService.getAssetKPIs();
      return res.json(sendSuccess(data, 'Asset inventory KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets
  async createAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetManagementService.createAsset(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'IT asset created in master inventory'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets
  async getAssets(req: Request, res: Response) {
    try {
      const cat = req.query.category as string;
      const stat = req.query.status as string;
      const data = await assetManagementService.getAssets(cat, stat);
      return res.json(sendSuccess(data, 'Assets list retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/:id/assign
  async assignAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const assetId = parseInt(req.params.id);
      const { employee_id } = req.body;
      const data = await assetManagementService.assignAsset(assetId, employee_id, user?.id || 1);
      return res.json(sendSuccess(data, 'Asset assigned to employee'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /assets/assignments/:id/acknowledge
  async acknowledgeAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const assignmentId = parseInt(req.params.id);
      const data = await assetManagementService.acknowledgeAsset(assignmentId, user?.id || 1);
      return res.json(sendSuccess(data, 'Asset receipt acknowledged'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /assets/:id/return
  async returnAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const assetId = parseInt(req.params.id);
      const data = await assetManagementService.returnAsset(assetId, user?.id || 1);
      return res.json(sendSuccess(data, 'Asset returned to inventory'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /assets/:id/maintenance
  async scheduleMaintenance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const assetId = parseInt(req.params.id);
      const { maintenance_type, description, cost, start_date } = req.body;
      const data = await assetManagementService.scheduleMaintenance(assetId, maintenance_type, description, cost, start_date, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Asset maintenance scheduled'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /assets/:id/issues
  async reportIssue(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const assetId = parseInt(req.params.id);
      const { issue_type, description, severity } = req.body;
      const data = await assetManagementService.reportIssue(assetId, user?.id || 1, issue_type, description, severity);
      return res.status(201).json(sendSuccess(data, 'Asset issue reported'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const assetManagementController = new AssetManagementController();
