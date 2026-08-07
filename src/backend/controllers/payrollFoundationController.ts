import { Request, Response } from 'express';
import { payrollFoundationService } from '../services/payrollFoundationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayrollFoundationController {
  // POST /payroll/seed-defaults
  async seedDefaults(req: Request, res: Response) {
    try {
      await payrollFoundationService.seedDefaults();
      return res.json(sendSuccess(null, 'Salary components pre-seeded'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/calculate-preview
  async calculatePreview(req: Request, res: Response) {
    try {
      const ctc = parseFloat(req.body.annual_ctc);
      if (isNaN(ctc) || ctc <= 0) return res.status(400).json(sendError('Valid Annual CTC required'));
      const data = payrollFoundationService.calculateSalaryBreakdown(ctc);
      return res.json(sendSuccess(data, 'Salary breakdown preview calculated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /payroll/assign
  async assignSalary(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollFoundationService.assignSalaryStructure(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Salary structure assigned successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/assignments
  async getAllAssignments(req: Request, res: Response) {
    try {
      const data = await payrollFoundationService.getAllSalaryAssignments();
      return res.json(sendSuccess(data, 'All employee salary assignments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/assignment/:employeeId
  async getEmployeeAssignment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.params.employeeId ? parseInt(req.params.employeeId) : user?.id;
      const data = await payrollFoundationService.getEmployeeSalaryAssignment(empId);
      return res.json(sendSuccess(data, 'Employee salary assignment retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/templates
  async getTemplates(req: Request, res: Response) {
    try {
      const data = await payrollFoundationService.getSalaryTemplates();
      return res.json(sendSuccess(data, 'Salary templates retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/templates
  async createTemplate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollFoundationService.createSalaryTemplate(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Salary template created'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /payroll/revisions
  async requestRevision(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollFoundationService.requestSalaryRevision(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Salary revision processed and updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/revisions
  async getRevisions(req: Request, res: Response) {
    try {
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const data = await payrollFoundationService.getSalaryRevisions(empId);
      return res.json(sendSuccess(data, 'Salary revisions retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/settings
  async getSettings(req: Request, res: Response) {
    try {
      const data = await payrollFoundationService.getPayrollSettings();
      return res.json(sendSuccess(data, 'Payroll settings retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/settings
  async updateSettings(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollFoundationService.updatePayrollSettings(req.body, user?.id || 1);
      return res.json(sendSuccess(data, 'Payroll settings updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/dashboard/kpis
  async getDashboardKPIs(req: Request, res: Response) {
    try {
      const data = await payrollFoundationService.getCompensationDashboardKPIs();
      return res.json(sendSuccess(data, 'Compensation dashboard KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const payrollFoundationController = new PayrollFoundationController();
