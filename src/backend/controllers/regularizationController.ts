import { Request, Response } from 'express';
import { regularizationService } from '../services/regularizationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class RegularizationController {
  // POST /attendance/regularizations
  async submit(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await regularizationService.submit({
        ...req.body,
        employee_id: user?.id || req.body.employee_id,
      });
      return res.status(201).json(sendSuccess(data, 'Regularization request submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /attendance/regularizations
  async getAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user?.role || 'EMPLOYEE';
      const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(role);
      const isHR = role === 'HR_MANAGER' || role === 'SUPER_ADMIN' || role === 'ADMIN';

      const data = await regularizationService.getAll({
        employee_id: !isManager ? user?.id : undefined,
        manager_id: isManager && !isHR ? user?.id : undefined,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        isManager,
        isHR,
      });
      return res.json(sendSuccess(data, 'Regularization requests retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /attendance/regularizations/:id
  async getById(req: Request, res: Response) {
    try {
      const data = await regularizationService.getById(parseInt(req.params.id));
      return res.json(sendSuccess(data, 'Regularization request retrieved'));
    } catch (e: any) {
      return res.status(404).json(sendError(e.message));
    }
  }

  // GET /attendance/pending-approvals
  async getPendingApprovals(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await regularizationService.getPendingApprovals(user?.id, user?.role);
      return res.json(sendSuccess(data, 'Pending approval queue retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /attendance/regularizations/request-types
  async getRequestTypes(req: Request, res: Response) {
    return res.json(sendSuccess(regularizationService.listRequestTypes(), 'Request types retrieved'));
  }

  // PATCH /attendance/regularizations/:id/approve
  async approve(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user?.role || 'EMPLOYEE';
      const id = parseInt(req.params.id);
      const { comment = '' } = req.body;

      let data;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        data = await regularizationService.adminAction(id, 'APPROVED', user.id, comment);
      } else if (role === 'HR_MANAGER') {
        data = await regularizationService.hrAction(id, 'APPROVED', user.id, comment);
      } else {
        data = await regularizationService.managerAction(id, 'APPROVED', user.id, comment);
      }
      return res.json(sendSuccess(data, 'Request approved and attendance updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /attendance/regularizations/:id/reject
  async reject(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user?.role || 'EMPLOYEE';
      const id = parseInt(req.params.id);
      const { comment = '', rejection_reason = '' } = req.body;
      const fullComment = rejection_reason || comment;

      let data;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        data = await regularizationService.adminAction(id, 'REJECTED', user.id, fullComment);
      } else if (role === 'HR_MANAGER') {
        data = await regularizationService.hrAction(id, 'REJECTED', user.id, fullComment);
      } else {
        data = await regularizationService.managerAction(id, 'REJECTED', user.id, fullComment);
      }
      return res.json(sendSuccess(data, 'Request rejected'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /attendance/regularizations/:id/request-info
  async requestInfo(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { comment = 'Please provide additional information' } = req.body;
      const data = await regularizationService.managerAction(id, 'INFO_REQUESTED', user.id, comment);
      return res.json(sendSuccess(data, 'Information requested from employee'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /attendance/regularizations/:id/forward-hr
  async forwardToHR(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { comment = 'Forwarded to HR for review' } = req.body;
      const data = await regularizationService.managerAction(id, 'FORWARD_HR', user.id, comment);
      return res.json(sendSuccess(data, 'Request forwarded to HR'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /attendance/regularizations/bulk-approve
  async bulkApprove(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(sendError('Request IDs array required'));
      }
      const data = await regularizationService.bulkApprove(ids.map(Number), user.id, user.role);
      const passed = data.filter(d => d.success).length;
      return res.json(sendSuccess(data, `Bulk action complete: ${passed}/${ids.length} processed`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // DELETE /attendance/regularizations/:id
  async cancel(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await regularizationService.cancel(id, user.id);
      return res.json(sendSuccess(data, 'Request cancelled'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /attendance/regularizations/:id/comments
  async addComment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { comment, is_internal = false } = req.body;
      if (!comment?.trim()) return res.status(400).json(sendError('Comment cannot be empty'));
      const data = await regularizationService.addComment(id, user.id, comment, is_internal);
      return res.status(201).json(sendSuccess(data, 'Comment added'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /attendance/regularizations/stats
  async getStats(req: Request, res: Response) {
    try {
      const data = await regularizationService.getStats(
        req.query.startDate as string,
        req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Regularization statistics retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const regularizationController = new RegularizationController();
