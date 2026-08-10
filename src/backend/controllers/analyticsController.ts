import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AnalyticsController {
  // GET /analytics/attendance/dashboard
  async getDashboard(req: Request, res: Response) {
    try {
      const data = await analyticsService.getLiveDashboard();
      return res.json(sendSuccess(data, 'Live attendance KPIs retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/trend?days=30
  async getTrend(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getAttendanceTrend(days);
      return res.json(sendSuccess(data, 'Attendance trend retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/departments
  async getDepartments(req: Request, res: Response) {
    try {
      const data = await analyticsService.getDepartmentComparison(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Department comparison retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/branches
  async getBranches(req: Request, res: Response) {
    try {
      const data = await analyticsService.getBranchComparison(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Branch comparison retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/monthly-trend?year=2026
  async getMonthlyTrend(req: Request, res: Response) {
    try {
      const year = parseInt(req.query.year as string) || undefined;
      const data = await analyticsService.getMonthlyTrend(year);
      return res.json(sendSuccess(data, 'Monthly trend retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/calendar?year=2026&month=8&employeeId=5
  async getCalendar(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(user?.role);
      const reqEmpId = req.query.employeeId ? parseInt(req.query.employeeId as string) : null;
      const employeeId = (isManager && reqEmpId) ? reqEmpId : user?.id;

      const data = await analyticsService.getCalendar(
        employeeId,
        parseInt(req.query.year as string) || undefined,
        parseInt(req.query.month as string) || undefined
      );
      return res.json(sendSuccess(data, 'Calendar data retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/employee-report?employeeId=5&startDate=...&endDate=...
  async getEmployeeReport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(user?.role);
      const empId = isManager && req.query.employeeId
        ? parseInt(req.query.employeeId as string)
        : user?.id;

      const data = await analyticsService.getEmployeeReport(
        empId, req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Employee attendance report retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/late-report
  async getLateReport(req: Request, res: Response) {
    try {
      const data = await analyticsService.getLateReport(
        req.query.startDate as string,
        req.query.endDate as string,
        req.query.deptId ? parseInt(req.query.deptId as string) : undefined
      );
      return res.json(sendSuccess(data, 'Late arrival report retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/overtime-report
  async getOvertimeReport(req: Request, res: Response) {
    try {
      const data = await analyticsService.getOvertimeReport(
        req.query.startDate as string,
        req.query.endDate as string,
        req.query.deptId ? parseInt(req.query.deptId as string) : undefined
      );
      return res.json(sendSuccess(data, 'Overtime report retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/absent-report?date=2026-08-07
  async getAbsentReport(req: Request, res: Response) {
    try {
      const data = await analyticsService.getAbsentReport(req.query.date as string);
      return res.json(sendSuccess(data, 'Absent report retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/monthly-summary?year=2026&month=8&deptId=1
  async getMonthlySummary(req: Request, res: Response) {
    try {
      const data = await analyticsService.getMonthlyAttendanceSummary(
        parseInt(req.query.year as string) || undefined,
        parseInt(req.query.month as string) || undefined,
        req.query.deptId ? parseInt(req.query.deptId as string) : undefined
      );
      return res.json(sendSuccess(data, 'Monthly attendance summary retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/payroll-sync?year=2026&month=8
  async getPayrollSync(req: Request, res: Response) {
    try {
      const data = await analyticsService.getPayrollSync(
        parseInt(req.query.year as string) || undefined,
        parseInt(req.query.month as string) || undefined,
        req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined
      );
      return res.json(sendSuccess(data, 'Payroll attendance sync data retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/gps-compliance
  async getGPSCompliance(req: Request, res: Response) {
    try {
      const data = await analyticsService.getGPSCompliance(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'GPS compliance report retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/charts
  async getChartsData(req: Request, res: Response) {
    try {
      const data = await analyticsService.getAllChartsData(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Chart data retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // POST /analytics/attendance/log-export
  async logExport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { reportType, format, filters } = req.body;
      await analyticsService.logExport(user?.id, reportType, format, filters || {});
      return res.json(sendSuccess(null, 'Export logged'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/punch-distribution
  async getPunchDistribution(req: Request, res: Response) {
    try {
      const data = await analyticsService.getPunchDistribution(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Punch distribution retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // GET /analytics/attendance/work-hour-distribution
  async getWorkHourDistribution(req: Request, res: Response) {
    try {
      const data = await analyticsService.getWorkHourDistribution(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Work hour distribution retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // ─── Leave Analytics Merged Controller Endpoints ──────────────────────────
  // GET /analytics/leave/kpis
  async getLeaveKPIs(req: Request, res: Response) {
    try {
      const data = await analyticsService.getExecutiveKPIs();
      return res.json(sendSuccess(data, 'Executive leave KPIs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/trend
  async getLeaveTrend(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = await analyticsService.getMonthlyLeaveTrend(year);
      return res.json(sendSuccess(data, 'Monthly leave trend retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/departments
  async getLeaveDepartments(req: Request, res: Response) {
    try {
      const data = await analyticsService.getDepartmentLeaveAnalytics();
      return res.json(sendSuccess(data, 'Department leave analytics retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/branches
  async getLeaveBranches(req: Request, res: Response) {
    try {
      const data = await analyticsService.getBranchLeaveAnalytics();
      return res.json(sendSuccess(data, 'Branch leave analytics retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/heatmap
  async getLeaveHeatmap(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const data = await analyticsService.getLeaveHeatmap(year, month);
      return res.json(sendSuccess(data, 'Leave heatmap retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /analytics/leave/forecast
  async getLeaveForecast(req: Request, res: Response) {
    try {
      const data = await analyticsService.getLeaveForecast();
      return res.json(sendSuccess(data, 'Leave load forecast retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /analytics/leave/log-export
  async logLeaveExport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { report_type, filename } = req.body;
      await analyticsService.logReportExport(user?.id || 1, report_type, filename);
      return res.json(sendSuccess(null, 'Export logged'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const analyticsController = new AnalyticsController();
