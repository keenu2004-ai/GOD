import { Request, Response } from 'express';
import { leaveManagementService } from '../services/leaveManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LeaveManagementController {
  // GET /leaves/balances
  async getBalances(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveManagementService.getLeaveBalances(user?.id || 1);
      return res.json(sendSuccess(data, 'Leave balances retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /leaves/balances/adjust
  async adjustBalance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { employee_id, leave_type_id, amount, transaction_type, reason } = req.body;
      const data = await leaveManagementService.adjustLeaveBalance(
        parseInt(employee_id), parseInt(leave_type_id), Number(amount), transaction_type || 'ADJUSTMENT_INCREASE', reason, user?.id || 1
      );
      return res.status(201).json(sendSuccess(data, 'Leave balance adjusted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /leaves/ledger
  async getLedger(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveManagementService.getBalanceLedger(user?.id || 1);
      return res.json(sendSuccess(data, 'Leave balance ledger retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /leaves/apply
  async applyLeave(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { leave_type_id, start_date, end_date, is_half_day, reason } = req.body;
      const data = await leaveManagementService.applyLeave({
        employee_id: user?.id || 1,
        leave_type_id: parseInt(leave_type_id),
        start_date,
        end_date,
        is_half_day: Boolean(is_half_day),
        reason,
      });
      return res.status(201).json(sendSuccess(data, 'Leave application submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /leaves/applications
  async getApplications(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveManagementService.getApplications(user?.id || 1);
      return res.json(sendSuccess(data, 'Leave applications retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /leaves/:id/approve
  async approveLeave(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await leaveManagementService.approveLeave(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Leave application approved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /leaves/:id/cancel
  async cancelLeave(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await leaveManagementService.cancelLeave(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Leave application cancelled'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const leaveManagementController = new LeaveManagementController();
