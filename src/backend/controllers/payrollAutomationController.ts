import { Request, Response } from 'express';
import { payrollAutomationService } from '../services/payrollAutomationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayrollAutomationController {
  // GET /payroll/validate
  async validatePayroll(req: Request, res: Response) {
    try {
      const month = (req.query.month as string) || new Date().toLocaleString('en', { month: 'long' });
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

      const data = await payrollAutomationService.runPreflightValidation(month, year);
      return res.json(sendSuccess(data, 'Payroll pre-flight auto-validation completed'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/bank-file
  async downloadBankFile(req: Request, res: Response) {
    try {
      const month = (req.query.month as string) || new Date().toLocaleString('en', { month: 'long' });
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

      const file = await payrollAutomationService.generateBankTransferFile(month, year);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      return res.send(file.content);
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /payroll/cron/maintenance
  async runCron(req: Request, res: Response) {
    try {
      const data = await payrollAutomationService.runPayrollMaintenanceCron();
      return res.json(sendSuccess(data, 'Payroll maintenance cron executed'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const payrollAutomationController = new PayrollAutomationController();
