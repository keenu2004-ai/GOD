import { Request, Response } from 'express';
import { expensePolicyService } from '../services/expensePolicyService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ExpensePolicyController {
  // GET /expenses/risk-flags
  async getRiskFlags(req: Request, res: Response) {
    try {
      const data = await expensePolicyService.getRiskFlags();
      return res.json(sendSuccess(data, 'Expense risk flags retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /expenses/risk-flags/:id/clear
  async clearRiskFlag(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await expensePolicyService.clearRiskFlag(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Risk flag cleared by Finance'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /expenses/budgets
  async createBudget(req: Request, res: Response) {
    try {
      const data = await expensePolicyService.createExpenseBudget(req.body);
      return res.status(201).json(sendSuccess(data, 'Cost center budget allocated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /expenses/budgets
  async getBudgets(req: Request, res: Response) {
    try {
      const data = await expensePolicyService.getExpenseBudgets();
      return res.json(sendSuccess(data, 'Cost center budgets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /expenses/reconciliations
  async reconcilePayment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { expense_id, approved_amount, paid_amount, payment_reference } = req.body;
      const data = await expensePolicyService.reconcilePayment(
        parseInt(expense_id), Number(approved_amount), Number(paid_amount), payment_reference, user?.id || 1
      );
      return res.status(201).json(sendSuccess(data, 'Expense payment reconciled'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /expenses/reconciliations
  async getReconciliations(req: Request, res: Response) {
    try {
      const data = await expensePolicyService.getReconciliations();
      return res.json(sendSuccess(data, 'Reconciliations retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /expenses/periods/lock
  async lockPeriod(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { period_name } = req.body;
      const data = await expensePolicyService.lockPeriod(period_name, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Financial period locked'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /expenses/periods
  async getPeriodLocks(req: Request, res: Response) {
    try {
      const data = await expensePolicyService.getPeriodLocks();
      return res.json(sendSuccess(data, 'Financial period locks retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const expensePolicyController = new ExpensePolicyController();
