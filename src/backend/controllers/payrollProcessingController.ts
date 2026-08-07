import { Request, Response } from 'express';
import { payrollProcessingService } from '../services/payrollProcessingService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayrollProcessingController {
  // POST /payroll/process
  async processPayroll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollProcessingService.generatePayrollRun(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Payroll processing completed and preview generated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/preview
  async getPreview(req: Request, res: Response) {
    try {
      const month = (req.query.month as string) || new Date().toLocaleString('en', { month: 'long' });
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

      const data = await payrollProcessingService.getPayrollRunDetails(month, year);
      return res.json(sendSuccess(data, 'Payroll run details and items retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/approve
  async approvePayroll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollProcessingService.approvePayrollRun(req.body, user?.id || 1);
      return res.json(sendSuccess(data, 'Payroll approval logged'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /payroll/unlock
  async unlockPayroll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { month, year, reason } = req.body;
      const data = await payrollProcessingService.unlockPayrollPeriod(month, parseInt(year), reason, user?.id || 1);
      return res.json(sendSuccess(data, 'Payroll period unlocked'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /payroll/adjustment
  async addAdjustment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollProcessingService.addAdjustment(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Payroll adjustment added'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const payrollProcessingController = new PayrollProcessingController();
