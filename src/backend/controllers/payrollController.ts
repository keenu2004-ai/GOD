import { Request, Response } from 'express';
import { payrollService } from '../services/miscServices.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayrollController {
  async getAllPayrolls(req: Request, res: Response) {
    try {
      const month = req.query.month as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;

      const data = await payrollService.getAllPayrolls(month, year, empId);
      return res.json(sendSuccess(data, 'Payroll records retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getPayslip(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await payrollService.getPayslipDetails(id);
      return res.json(sendSuccess(data, 'Payslip details retrieved'));
    } catch (error: any) {
      return res.status(404).json(sendError(error.message));
    }
  }

  async generatePayroll(req: Request, res: Response) {
    try {
      const { employee_id, month, year, basic_salary } = req.body;
      const data = await payrollService.generatePayroll(employee_id, month, year, basic_salary);
      return res.status(201).json(sendSuccess(data, 'Payroll generated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const payrollController = new PayrollController();

