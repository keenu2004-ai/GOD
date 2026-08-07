import { Request, Response } from 'express';
import { leaveBalanceEngineService } from '../services/leaveBalanceEngineService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LeaveBalanceEngineController {
  // POST /leave/adjust
  async adjustBalance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveBalanceEngineService.adjustBalance(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Leave balance adjusted successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/accrue-monthly
  async runMonthlyAccrual(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const periodStr = (req.body.period as string) || new Date().toISOString().slice(0, 7);
      const data = await leaveBalanceEngineService.runMonthlyAccrual(periodStr, user?.id || 1);
      return res.json(sendSuccess(data, 'Monthly leave accrual processed'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /leave/comp-off/request
  async requestCompOff(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { date_worked, days = 1.0, reason } = req.body;
      const data = await leaveBalanceEngineService.requestCompOff(
        user?.id || req.body.employee_id,
        date_worked,
        parseFloat(days),
        reason
      );
      return res.status(201).json(sendSuccess(data, 'Comp-off requested successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /leave/comp-off/:id/approve
  async approveCompOff(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await leaveBalanceEngineService.approveCompOff(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Comp-off approved and balance credited'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/carry-forward/run
  async runYearEndCarryForward(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const year = req.body.year ? parseInt(req.body.year) : new Date().getFullYear();
      const data = await leaveBalanceEngineService.runYearEndCarryForward(year, user?.id || 1);
      return res.json(sendSuccess(data, 'Year-end carry forward completed'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /leave/ledger
  async getLedger(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const typeId = req.query.leaveTypeId ? parseInt(req.query.leaveTypeId as string) : undefined;
      const data = await leaveBalanceEngineService.getLedgerTransactions(empId, typeId);
      return res.json(sendSuccess(data, 'Leave ledger history retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /leave/adjustments
  async getAdjustments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await leaveBalanceEngineService.getAdjustments(empId);
      return res.json(sendSuccess(data, 'Leave adjustments history retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /leave/comp-offs
  async getCompOffs(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await leaveBalanceEngineService.getCompOffs(empId);
      return res.json(sendSuccess(data, 'Comp-offs retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const leaveBalanceEngineController = new LeaveBalanceEngineController();
