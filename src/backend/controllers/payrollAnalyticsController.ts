import { Request, Response } from 'express';
import { payrollAnalyticsService } from '../services/payrollAnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayrollAnalyticsController {
  // GET /payroll/analytics/kpis
  async getExecutiveKPIs(req: Request, res: Response) {
    try {
      const data = await payrollAnalyticsService.getExecutiveKPIs();
      return res.json(sendSuccess(data, 'Executive payroll KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/analytics/departments
  async getDepartmentBreakup(req: Request, res: Response) {
    try {
      const data = await payrollAnalyticsService.getDepartmentCostBreakup();
      return res.json(sendSuccess(data, 'Departmental payroll cost breakup retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/analytics/branches
  async getBranchBreakup(req: Request, res: Response) {
    try {
      const data = await payrollAnalyticsService.getBranchCostBreakup();
      return res.json(sendSuccess(data, 'Branch payroll cost breakup retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/analytics/trend
  async getTrend(req: Request, res: Response) {
    try {
      const data = await payrollAnalyticsService.get12MonthPayrollTrend();
      return res.json(sendSuccess(data, '12-month payroll cost trend retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/analytics/forecast
  async getForecast(req: Request, res: Response) {
    try {
      const data = await payrollAnalyticsService.getPredictivePayrollForecast();
      return res.json(sendSuccess(data, 'Predictive payroll forecast retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/analytics/budget
  async setBudget(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await payrollAnalyticsService.setDepartmentBudget(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Department annual budget set'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/analytics/budget
  async getBudgets(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : 2026;
      const data = await payrollAnalyticsService.getDepartmentBudgets(year);
      return res.json(sendSuccess(data, 'Department budgets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const payrollAnalyticsController = new PayrollAnalyticsController();
