import { Request, Response } from 'express';
import { assetMaintenanceService } from '../services/assetMaintenanceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AssetMaintenanceController {
  // POST /assets/warranty-claims
  async createWarrantyClaim(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetMaintenanceService.createWarrantyClaim(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Warranty claim submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/warranty-claims
  async getWarrantyClaims(req: Request, res: Response) {
    try {
      const data = await assetMaintenanceService.getWarrantyClaims();
      return res.json(sendSuccess(data, 'Warranty claims retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/damage-investigations
  async createDamageInvestigation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetMaintenanceService.createDamageInvestigation(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Damage investigation initiated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/damage-investigations
  async getDamageInvestigations(req: Request, res: Response) {
    try {
      const data = await assetMaintenanceService.getDamageInvestigations();
      return res.json(sendSuccess(data, 'Damage investigations retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/payroll-recoveries
  async createPayrollRecovery(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetMaintenanceService.createPayrollRecovery(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Payroll recovery request created'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/payroll-recoveries
  async getPayrollRecoveries(req: Request, res: Response) {
    try {
      const data = await assetMaintenanceService.getPayrollRecoveries();
      return res.json(sendSuccess(data, 'Payroll recoveries retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /assets/payroll-recoveries/:id/approve
  async approvePayrollRecovery(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await assetMaintenanceService.approvePayrollRecovery(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Payroll recovery approved for payroll deduction'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const assetMaintenanceController = new AssetMaintenanceController();
