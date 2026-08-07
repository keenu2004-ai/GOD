import { Request, Response } from 'express';
import { exitManagementService } from '../services/exitManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ExitManagementController {
  // POST /exit/resignation
  async submitResignation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dto = { ...req.body, employee_id: user?.role === 'EMPLOYEE' ? user?.id : (req.body.employee_id || user?.id) };
      const data = await exitManagementService.submitResignation(dto);
      return res.status(201).json(sendSuccess(data, 'Resignation submitted successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /exit/resignation/:id/approve
  async approveResignation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await exitManagementService.approveResignation(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Resignation approved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /exit/resignations
  async getResignations(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await exitManagementService.getResignations(empId);
      return res.json(sendSuccess(data, 'Resignations retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /exit/clearance
  async clearDepartment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await exitManagementService.clearDepartment(req.body, user?.id || 1);
      return res.json(sendSuccess(data, 'Department clearance recorded'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /exit/clearances/:resignationId
  async getClearances(req: Request, res: Response) {
    try {
      const resId = parseInt(req.params.resignationId);
      const data = await exitManagementService.getClearances(resId);
      return res.json(sendSuccess(data, 'Department clearances retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /exit/fnf/calculate
  async calculateFnF(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const resId = parseInt(req.body.resignation_id);
      const data = await exitManagementService.calculateFnFSettlement(resId, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Full & Final (FnF) Settlement calculated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /exit/fnf/:id/approve
  async approveFnF(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await exitManagementService.approveFnFSettlement(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Full & Final (FnF) Settlement approved and finalized'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /exit/fnf/:resignationId
  async getFnF(req: Request, res: Response) {
    try {
      const resId = parseInt(req.params.resignationId);
      const data = await exitManagementService.getFnFSettlement(resId);
      return res.json(sendSuccess(data, 'Full & Final (FnF) Settlement retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const exitManagementController = new ExitManagementController();
