import { Request, Response } from 'express';
import { assetAnalyticsService } from '../services/assetAnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AssetAnalyticsController {
  // GET /assets/analytics/financial
  async getFinancialAnalytics(req: Request, res: Response) {
    try {
      const data = await assetAnalyticsService.getFinancialAnalytics();
      return res.json(sendSuccess(data, 'Asset financial analytics retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/depreciation/calculate
  async calculateDepreciation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetAnalyticsService.calculateDepreciation(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Asset depreciation calculated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/depreciation/schedules
  async getDepreciationSchedules(req: Request, res: Response) {
    try {
      const data = await assetAnalyticsService.getDepreciationSchedules();
      return res.json(sendSuccess(data, 'Depreciation schedules retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/audits
  async createAudit(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { audit_name } = req.body;
      const data = await assetAnalyticsService.createInventoryAudit(audit_name, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Physical inventory audit started'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/audits
  async getAudits(req: Request, res: Response) {
    try {
      const data = await assetAnalyticsService.getInventoryAudits();
      return res.json(sendSuccess(data, 'Inventory audits retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/audits/:id/findings
  async recordFinding(req: Request, res: Response) {
    try {
      const auditId = parseInt(req.params.id);
      const { asset_id, discrepancy_type, actual_location } = req.body;
      const data = await assetAnalyticsService.recordAuditFinding(auditId, asset_id, discrepancy_type, actual_location);
      return res.status(201).json(sendSuccess(data, 'Audit discrepancy recorded'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/audit-findings
  async getFindings(req: Request, res: Response) {
    try {
      const auditId = req.query.auditId ? parseInt(req.query.auditId as string) : undefined;
      const data = await assetAnalyticsService.getAuditFindings(auditId);
      return res.json(sendSuccess(data, 'Audit findings retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /assets/audit-findings/:id/reconcile
  async reconcileFinding(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { action } = req.body;
      const data = await assetAnalyticsService.reconcileFinding(id, action, user?.id || 1);
      return res.json(sendSuccess(data, 'Audit finding reconciled'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const assetAnalyticsController = new AssetAnalyticsController();
