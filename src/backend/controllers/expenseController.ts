import { Request, Response } from 'express';
import { expenseService } from '../services/miscServices.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ExpenseController {
  async getAll(req: Request, res: Response) {
    try {
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
      const status = req.query.status as string;
      const data = await expenseService.getAllExpenses(empId, status);
      return res.json(sendSuccess(data, 'Expense claims retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id;
      const data = await expenseService.submitExpense({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Expense claim submitted'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const approverId = (req as any).user?.id || 1;
      const { status } = req.body;
      const data = await expenseService.approveExpense(id, status, approverId);
      return res.json(sendSuccess(data, `Expense claim ${status.toLowerCase()}`));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const expenseController = new ExpenseController();
