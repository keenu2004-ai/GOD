import { Request, Response } from 'express';
import { leaveWorkflowService } from '../services/leaveWorkflowService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LeaveWorkflowController {
  // GET /leave/conflicts/check
  async checkConflicts(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : user?.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      if (!startDate || !endDate) return res.status(400).json(sendError('startDate and endDate required'));

      const conflicts = await leaveWorkflowService.detectConflicts(empId, startDate, endDate);
      return res.json(sendSuccess(conflicts, 'Conflict detection complete'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /leave/team-availability
  async getTeamAvailability(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const startDate = (req.query.startDate as string) || new Date().toISOString().split('T')[0];
      const endDate = (req.query.endDate as string) || startDate;
      const managerId = req.query.managerId ? parseInt(req.query.managerId as string) : (user?.role === 'EMPLOYEE' ? 0 : user?.id);

      const data = await leaveWorkflowService.getTeamAvailability(managerId, startDate, endDate);
      return res.json(sendSuccess(data, 'Team availability matrix retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /leave/request
  async submitRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leaveWorkflowService.submitRequest({
        ...req.body,
        employee_id: user?.id || req.body.employee_id,
        leave_type_id: parseInt(req.body.leave_type_id),
        total_days: parseFloat(req.body.total_days),
      });
      return res.status(201).json(sendSuccess(data, 'Leave request submitted successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /leave/requests/:id/approve
  async approve(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { comment = '' } = req.body;
      const data = await leaveWorkflowService.processApproval(id, 'APPROVED', user.id, user.role, comment);
      return res.json(sendSuccess(data, 'Leave request approved and attendance synced'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /leave/requests/:id/reject
  async reject(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { comment = '' } = req.body;
      const data = await leaveWorkflowService.processApproval(id, 'REJECTED', user.id, user.role, comment);
      return res.json(sendSuccess(data, 'Leave request rejected'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/requests/bulk-approve
  async bulkApprove(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { ids, comment } = req.body;
      if (!ids || !Array.isArray(ids)) return res.status(400).json(sendError('Request IDs array required'));
      const data = await leaveWorkflowService.bulkApprove(ids.map(Number), user.id, user.role, comment);
      return res.json(sendSuccess(data, 'Bulk approval complete'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/requests/:id/override
  async superAdminOverride(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { action, reason } = req.body;
      const data = await leaveWorkflowService.superAdminOverride(id, action, user.id, reason);
      return res.json(sendSuccess(data, `Super Admin ${action} completed`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /leave/calendar-events
  async getCalendarEvents(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const data = await leaveWorkflowService.getCalendarEvents(year, month);
      return res.json(sendSuccess(data, 'Calendar events retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const leaveWorkflowController = new LeaveWorkflowController();
