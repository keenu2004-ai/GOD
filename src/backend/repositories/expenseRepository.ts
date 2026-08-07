import dbService from '../database/db.js';
import { ExpenseClaim } from '../types/index.js';

export class ExpenseRepository {
  async getAllExpenses(employeeId?: number, status?: string) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (employeeId) {
      conditions.push(`ex.employee_id = $${idx}`);
      params.push(employeeId);
      idx++;
    }

    if (status) {
      conditions.push(`ex.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT ex.*, e.first_name, e.last_name, e.employee_code, e.avatar_url, d.name as department_name,
             a.first_name as approver_first_name, a.last_name as approver_last_name
      FROM expenses ex
      JOIN employees e ON ex.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees a ON ex.approved_by = a.id
      ${whereClause}
      ORDER BY ex.id DESC
    `;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async createExpense(data: Partial<ExpenseClaim>): Promise<ExpenseClaim> {
    try {
      await dbService.query(`SELECT setval(pg_get_serial_sequence('expenses', 'id'), COALESCE((SELECT MAX(id) FROM expenses), 1))`);
    } catch (e) {}

    const res = await dbService.query<ExpenseClaim>(
      `INSERT INTO expenses (employee_id, title, category, amount, date, description, receipt_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING *`,
      [
        data.employee_id,
        data.title,
        data.category || 'MISC',
        data.amount,
        data.date || new Date().toISOString().split('T')[0],
        data.description || '',
        data.receipt_url || '',
      ]
    );
    return res.rows[0];
  }

  async updateExpenseStatus(id: number, status: 'APPROVED' | 'REJECTED', approvedBy: number) {
    const res = await dbService.query<ExpenseClaim>(
      `UPDATE expenses
       SET status = $1, approved_by = $2
       WHERE id = $3
       RETURNING *`,
      [status, approvedBy, id]
    );
    return res.rows[0] || null;
  }
}

export const expenseRepository = new ExpenseRepository();
