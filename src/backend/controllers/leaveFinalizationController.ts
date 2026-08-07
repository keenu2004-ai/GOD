import { Request, Response } from 'express';
import { leaveFinalizationService } from '../services/leaveFinalizationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LeaveFinalizationController {
  // POST /leave/bulk/assign-policy
  async bulkAssignPolicy(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveFinalizationService.bulkAssignPolicy(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Bulk policy assignment completed successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/bulk/adjust-balances
  async bulkAdjustBalances(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveFinalizationService.bulkAdjustBalances(req.body, user?.id || 1);
      return res.json(sendSuccess(data, 'Bulk balance adjustments processed'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/cron/run-maintenance
  async runMaintenance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveFinalizationService.runAutomatedMaintenanceJobs(user?.id || 1);
      return res.json(sendSuccess(data, 'Automated leave maintenance cron completed'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /leave/import/template
  async getTemplate(req: Request, res: Response) {
    try {
      const data = leaveFinalizationService.getImportTemplate();
      return res.json(sendSuccess(data, 'Import template retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const leaveFinalizationController = new LeaveFinalizationController();
