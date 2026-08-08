import { Request, Response } from 'express';
import { assetManagementService } from '../services/assetManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AssetManagementController {
  // POST /assets/create
  async createAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetManagementService.createAsset(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Asset created in inventory'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/all
  async getAssets(req: Request, res: Response) {
    try {
      const data = await assetManagementService.getAssets();
      return res.json(sendSuccess(data, 'Assets inventory retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/assign
  async assignAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { asset_id, employee_id } = req.body;
      const data = await assetManagementService.assignAsset(parseInt(asset_id), parseInt(employee_id), user?.id || 1);
      return res.json(sendSuccess(data, 'Asset assigned to employee'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /assets/transfer
  async transferAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { asset_id, from_employee_id, to_employee_id, reason } = req.body;
      const data = await assetManagementService.transferAsset(
        parseInt(asset_id), parseInt(from_employee_id || '0'), parseInt(to_employee_id), reason, user?.id || 1
      );
      return res.json(sendSuccess(data, 'Asset transferred successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/my-assets
  async getMyAssets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetManagementService.getMyAssignedAssets(user?.id || 1);
      return res.json(sendSuccess(data, 'My assigned assets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const assetManagementController = new AssetManagementController();
