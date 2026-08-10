import { Request, Response } from 'express';
import { payslipPortalService } from '../services/payslipPortalService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayslipPortalController {
  // GET /payroll/payslip/view
  async viewPayslip(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const month = (req.query.month as string) || new Date().toLocaleString('en', { month: 'long' });
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : user?.id;

      const data = await payslipPortalService.getEmployeePayslipDetails(empId, month, year, user?.id || 1);
      if (!data) return res.status(404).json(sendError(`No payslip found for ${month} ${year}`));
      return res.json(sendSuccess(data, 'Digital payslip details retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/payslip/log-download
  async logDownload(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { payslip_id } = req.body;
      const ip = req.ip || '127.0.0.1';
      await payslipPortalService.logDownload(parseInt(payslip_id), user?.id || 1, ip);
      return res.json(sendSuccess(null, 'Payslip download logged'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/self-service/feed
  async getSelfServiceFeed(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : user?.id;
      const data = await payslipPortalService.getEmployeeSelfServiceFeed(empId);
      return res.json(sendSuccess(data, 'Employee self-service payroll feed retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const payslipPortalController = new PayslipPortalController();
