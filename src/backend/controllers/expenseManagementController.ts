import { Request, Response } from 'express';
import { expenseManagementService } from '../services/expenseManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ExpenseManagementController {
  // POST /expenses/claims
  async createClaim(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await expenseManagementService.createExpenseClaim(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Expense claim submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /expenses/claims
  async getClaims(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user?.role || 'EMPLOYEE';
      const data = await expenseManagementService.getExpenseClaims(role, user?.id || 1);
      return res.json(sendSuccess(data, 'Expense claims retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /expenses/claims/:id/manager-approve
  async approveManager(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await expenseManagementService.approveManager(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Expense approved by manager'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /expenses/claims/:id/finance-settle
  async approveFinanceAndSettle(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { reimbursed_amount, payment_reference } = req.body;
      const data = await expenseManagementService.approveFinanceAndSettle(id, Number(reimbursed_amount), payment_reference, user?.id || 1);
      return res.json(sendSuccess(data, 'Expense reimbursed and marked paid'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /expenses/claims/:id/reject
  async rejectExpense(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const data = await expenseManagementService.rejectExpense(id, reason || 'Policy non-compliance', user?.id || 1);
      return res.json(sendSuccess(data, 'Expense rejected'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /expenses/advances
  async requestAdvance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await expenseManagementService.requestAdvance(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Expense advance requested'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /expenses/advances
  async getAdvances(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user?.role || 'EMPLOYEE';
      const data = await expenseManagementService.getAdvances(role, user?.id || 1);
      return res.json(sendSuccess(data, 'Expense advances retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /expenses/advances/:id/settle
  async settleAdvance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { settled_amount } = req.body;
      const data = await expenseManagementService.settleAdvance(id, Number(settled_amount), user?.id || 1);
      return res.json(sendSuccess(data, 'Expense advance settled'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const expenseManagementController = new ExpenseManagementController();
