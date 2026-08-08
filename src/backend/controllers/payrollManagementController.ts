import { Request, Response } from 'express';
import { payrollManagementService } from '../services/payrollManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayrollManagementController {
  // POST /payroll/process
  async processPayroll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollManagementService.processPayrollPeriod(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Payroll period processed successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/runs
  async getPayrollRuns(req: Request, res: Response) {
    try {
      const data = await payrollManagementService.getPayrollRuns();
      return res.json(sendSuccess(data, 'Payroll runs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/records
  async getPayrollRecords(req: Request, res: Response) {
    try {
      const month = (req.query.month as string) || 'August';
      const year = parseInt((req.query.year as string) || '2026', 10);
      const data = await payrollManagementService.getPayrollRecords(month, year);
      return res.json(sendSuccess(data, 'Payroll records retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /payroll/runs/:id/lock
  async lockPayroll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await payrollManagementService.lockPayroll(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Payroll run locked'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/my-payslips
  async getMyPayslips(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollManagementService.getEmployeePayslips(user?.id || 1, user?.id || 1, user?.role || 'EMPLOYEE');
      return res.json(sendSuccess(data, 'My payslips retrieved'));
    } catch (e: any) {
      return res.status(403).json(sendError(e.message));
    }
  }
}

export const payrollManagementController = new PayrollManagementController();
