import { Request, Response } from 'express';
import { complianceService } from '../services/complianceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ComplianceController {
  // GET /compliance/pf-ecr?month=August&year=2026
  async getPFECR(req: Request, res: Response) {
    try {
      const month = (req.query.month as string) || 'August';
      const year = req.query.year ? parseInt(req.query.year as string, 10) : 2026;
      const user = (req as any).user;
      const data = await complianceService.generatePFECR(month, year, user?.organization_id);
      return res.json(sendSuccess(data, 'PF ECR statement generated successfully'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  // GET /compliance/esic-return?month=August&year=2026
  async getESICReturn(req: Request, res: Response) {
    try {
      const month = (req.query.month as string) || 'August';
      const year = req.query.year ? parseInt(req.query.year as string, 10) : 2026;
      const user = (req as any).user;
      const data = await complianceService.generateESICReturn(month, year, user?.organization_id);
      return res.json(sendSuccess(data, 'ESIC return statement generated successfully'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  // GET /compliance/form16/:employeeId
  async getForm16(req: Request, res: Response) {
    try {
      const empId = parseInt(req.params.employeeId, 10);
      const fy = (req.query.financialYear as string) || '2025-2026';
      const data = await complianceService.getForm16Estimate(empId, fy);
      return res.json(sendSuccess(data, 'Form 16 Tax Estimate generated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const complianceController = new ComplianceController();
