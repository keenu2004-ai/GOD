import { Request, Response } from 'express';
import { leaveService } from '../services/leaveService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LeaveController {
  async getAllLeaves(req: Request, res: Response) {
    try {
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
      const status = req.query.status as string;
      const data = await leaveService.getAllLeaves(empId, status);
      return res.json(sendSuccess(data, 'Leave applications retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getBalances(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || parseInt(req.params.employeeId, 10);
      const data = await leaveService.getLeaveBalances(userId);
      return res.json(sendSuccess(data, 'Leave balances retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getTypes(req: Request, res: Response) {
    try {
      const data = await leaveService.getLeaveTypes();
      return res.json(sendSuccess(data, 'Leave types retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getHolidays(req: Request, res: Response) {
    try {
      const data = await leaveService.getHolidays();
      return res.json(sendSuccess(data, 'Holidays list retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async applyLeave(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id;
      const data = await leaveService.applyLeave({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Leave request submitted successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async updateLeave(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = (req as any).user?.id || req.body.employee_id;
      const data = await leaveService.updateLeave(id, userId, req.body);
      return res.json(sendSuccess(data, 'Leave application updated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async cancelLeave(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = (req as any).user?.id || 1;
      const data = await leaveService.cancelLeave(id, userId);
      return res.json(sendSuccess(data, 'Leave application cancelled successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async bulkApprove(req: Request, res: Response) {
    try {
      const approverId = (req as any).user?.id || 1;
      const { ids, action, rejectionReason } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(sendError('Invalid or empty leave IDs array'));
      }
      const data = await leaveService.bulkProcessApprovals(ids, action, approverId, rejectionReason);
      return res.json(sendSuccess(data, `Bulk processing completed for ${ids.length} leave requests`));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getCalendar(req: Request, res: Response) {
    try {
      const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const data = await leaveService.getLeaveCalendar(month, year);
      return res.json(sendSuccess(data, 'Team leave calendar retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async processApproval(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const approverId = (req as any).user?.id || 1;
      const { status, rejectionReason } = req.body;
      const data = await leaveService.processLeaveApproval(id, status, approverId, rejectionReason);
      return res.json(sendSuccess(data, `Leave request processed as ${status}`));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async updateBalance(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId, 10);
      const { leave_type_id, total_days, remaining_days } = req.body;
      const data = await leaveService.updateLeaveBalance(employeeId, leave_type_id, total_days, remaining_days);
      return res.json(sendSuccess(data, 'Leave balance updated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const leaveController = new LeaveController();
