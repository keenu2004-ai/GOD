import { Request, Response } from 'express';
import { employeeManagementService } from '../services/employeeManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class EmployeeManagementController {
  // POST /employees/create
  async createEmployee(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await employeeManagementService.createEmployee(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Employee account & onboarding checklist created'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /employees/all
  async getEmployees(req: Request, res: Response) {
    try {
      const data = await employeeManagementService.getEmployees();
      return res.json(sendSuccess(data, 'Employee directory retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /employees/org-chart
  async getOrgChartTree(req: Request, res: Response) {
    try {
      const data = await employeeManagementService.getOrgChartTree();
      return res.json(sendSuccess(data, 'Visual organization chart tree retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /employees/:id/profile
  async getEmployeeProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = parseInt(req.params.id);
      const data = await employeeManagementService.getEmployeeProfile(empId, user?.id || 1, user?.role || 'EMPLOYEE');
      return res.json(sendSuccess(data, 'Employee profile & onboarding data retrieved'));
    } catch (e: any) {
      return res.status(403).json(sendError(e.message));
    }
  }
}

export const employeeManagementController = new EmployeeManagementController();
