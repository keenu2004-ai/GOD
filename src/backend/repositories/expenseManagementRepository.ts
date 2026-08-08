import dbService from '../database/db.js';

export interface CreateExpenseDTO {
  title: string;
  category: string;
  amount: number;
  currency?: string;
  merchant_name?: string;
  date: string;
  description?: string;
  receipt_url?: string;
  project_id?: number;
}

export interface RequestAdvanceDTO {
  advance_amount: number;
  purpose: string;
}

export class ExpenseManagementRepository {

  // ─── Create Expense Claim with Policy Validation ──────────────────────────
  async createExpenseClaim(dto: CreateExpenseDTO, employeeId: number) {
    const expNum = `EXP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    // Policy Rule Validation
    const ruleRes = await dbService.query(
      `SELECT * FROM expense_policy_rules WHERE category = $1`,
      [dto.category]
    );
    let policyWarning: string | null = null;
    if (ruleRes.rows.length > 0) {
      const maxLimit = parseFloat(ruleRes.rows[0].max_limit_amount || '25000');
      if (dto.amount > maxLimit) {
        policyWarning = `Claim amount ₹${dto.amount} exceeds configured category policy limit of ₹${maxLimit}`;
      }
    }

    const res = await dbService.query(
      `INSERT INTO expenses (
        expense_number, employee_id, title, category, amount, currency, merchant_name,
        date, description, receipt_url, project_id, status, policy_warning
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SUBMITTED', $12) RETURNING *`,
      [
        expNum, employeeId, dto.title, dto.category, dto.amount, dto.currency || 'INR',
        dto.merchant_name || null, dto.date, dto.description || null,
        dto.receipt_url || null, dto.project_id || null, policyWarning
      ]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_CLAIM_SUBMITTED', 'EXPENSES', $2)`,
      [employeeId, `Submitted Expense Claim ${expNum} of ₹${dto.amount}`]
    );

    return res.rows[0];
  }

  // ─── Get Expense Claims (RBAC Scoped) ─────────────────────────────────────
  async getExpenseClaims(userRole: string, employeeId: number) {
    const isFinanceOrAdmin = ['ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);
    let sql = `
      SELECT ex.*, e.first_name, e.last_name, e.employee_code, p.name as project_name
      FROM expenses ex
      JOIN employees e ON ex.employee_id = e.id
      LEFT JOIN projects p ON ex.project_id = p.id
    `;
    const params: any[] = [];
    if (!isFinanceOrAdmin) {
      sql += ` WHERE ex.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY ex.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Manager Approval ─────────────────────────────────────────────────────
  async approveManager(expenseId: number, managerId: number) {
    const res = await dbService.query(
      `UPDATE expenses
       SET status = 'MANAGER_APPROVED', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [managerId, expenseId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_MANAGER_APPROVED', 'EXPENSES', $2)`,
      [managerId, `Manager approved Expense Claim #${expenseId}`]
    );

    return res.rows[0];
  }

  // ─── Finance Settlement & Reimbursement ──────────────────────────────────
  async approveFinanceAndSettle(expenseId: number, reimbursedAmount: number, paymentRef: string | undefined, financeId: number) {
    const res = await dbService.query(
      `UPDATE expenses
       SET status = 'REIMBURSED', reimbursed_amount = $1, payment_status = 'PAID',
           payment_reference = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [reimbursedAmount, paymentRef || `REIMB-${Date.now()}`, expenseId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_REIMBURSED', 'EXPENSES', $2)`,
      [financeId, `Finance processed reimbursement of ₹${reimbursedAmount} for Expense #${expenseId}`]
    );

    return res.rows[0];
  }

  async rejectExpense(expenseId: number, reason: string, reviewerId: number) {
    const res = await dbService.query(
      `UPDATE expenses
       SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [expenseId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_REJECTED', 'EXPENSES', $2)`,
      [reviewerId, `Rejected Expense Claim #${expenseId}: ${reason}`]
    );

    return res.rows[0];
  }

  // ─── Expense Advance & Settlement Engine ──────────────────────────────────
  async requestAdvance(dto: RequestAdvanceDTO, employeeId: number) {
    const advNum = `ADV-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const res = await dbService.query(
      `INSERT INTO expense_advances (advance_number, employee_id, advance_amount, purpose, status)
       VALUES ($1, $2, $3, $4, 'PENDING_APPROVAL') RETURNING *`,
      [advNum, employeeId, dto.advance_amount, dto.purpose]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_ADVANCE_REQUESTED', 'EXPENSES', $2)`,
      [employeeId, `Requested Expense Advance ${advNum} of ₹${dto.advance_amount}`]
    );

    return res.rows[0];
  }

  async getAdvances(userRole: string, employeeId: number) {
    const isFinanceOrAdmin = ['ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);
    let sql = `
      SELECT ea.*, e.first_name, e.last_name, e.employee_code
      FROM expense_advances ea
      JOIN employees e ON ea.employee_id = e.id
    `;
    const params: any[] = [];
    if (!isFinanceOrAdmin) {
      sql += ` WHERE ea.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY ea.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async settleAdvance(advanceId: number, settledAmount: number, financeId: number) {
    const res = await dbService.query(
      `UPDATE expense_advances
       SET status = 'SETTLED', settled_amount = $1, is_settled = true
       WHERE id = $2 RETURNING *`,
      [settledAmount, advanceId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_ADVANCE_SETTLED', 'EXPENSES', $2)`,
      [financeId, `Settled Expense Advance #${advanceId} with amount ₹${settledAmount}`]
    );

    return res.rows[0];
  }
}

export const expenseManagementRepository = new ExpenseManagementRepository();
