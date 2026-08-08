import dbService from '../database/db.js';

export interface CreateBudgetDTO {
  cost_center_name: string;
  total_budget_amount: number;
}

export class ExpensePolicyRepository {

  // ─── Risk & Fraud Detection Engine ─────────────────────────────────────────
  async evaluateExpenseRisk(expenseId: number, amount: number, merchantName: string | undefined, date: string) {
    const dupRes = await dbService.query(
      `SELECT COUNT(*) as count FROM expenses
       WHERE amount = $1 AND date = $2 AND id != $3`,
      [amount, date, expenseId]
    );

    const dupCount = parseInt(dupRes.rows[0]?.count || '0', 10);
    const isDuplicate = dupCount > 0;
    const isHighValue = amount > 50000;

    if (isDuplicate || isHighValue) {
      const riskLevel = isDuplicate ? 'HIGH' : (isHighValue ? 'MEDIUM' : 'LOW');
      const riskReason = isDuplicate
        ? `Potential duplicate claim detected with identical amount ₹${amount} on ${date}`
        : `High-value expense claim exceeding ₹50,000 threshold`;

      const res = await dbService.query(
        `INSERT INTO expense_risk_flags (expense_id, risk_level, risk_reason, is_duplicate)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [expenseId, riskLevel, riskReason, isDuplicate]
      );
      return res.rows[0];
    }
    return null;
  }

  async getRiskFlags() {
    const res = await dbService.query(
      `SELECT rf.*, ex.expense_number, ex.title, ex.amount, e.first_name, e.last_name
       FROM expense_risk_flags rf
       JOIN expenses ex ON rf.expense_id = ex.id
       JOIN employees e ON ex.employee_id = e.id
       ORDER BY rf.created_at DESC`
    );
    return res.rows;
  }

  async clearRiskFlag(flagId: number, reviewerId: number) {
    const res = await dbService.query(
      `UPDATE expense_risk_flags SET is_cleared = true WHERE id = $1 RETURNING *`,
      [flagId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_RISK_CLEARED', 'EXPENSE_POLICY', $2)`,
      [reviewerId, `Cleared Risk Flag #${flagId}`]
    );

    return res.rows[0];
  }

  // ─── Financial Budget Controls ─────────────────────────────────────────────
  async createExpenseBudget(dto: CreateBudgetDTO) {
    const res = await dbService.query(
      `INSERT INTO expense_budgets (cost_center_name, total_budget_amount, committed_amount, paid_amount)
       VALUES ($1, $2, 0, 0) RETURNING *`,
      [dto.cost_center_name, dto.total_budget_amount]
    );
    return res.rows[0];
  }

  async getExpenseBudgets() {
    const res = await dbService.query(`SELECT * FROM expense_budgets ORDER BY created_at DESC`);
    return res.rows;
  }

  // ─── Payment Reconciliation & Period Lock Engine ──────────────────────────
  async reconcilePayment(expenseId: number, approvedAmount: number, paidAmount: number, paymentRef: string, reviewerId: number) {
    const status = approvedAmount === paidAmount ? 'MATCHED' : 'MISMATCH';

    const res = await dbService.query(
      `INSERT INTO expense_reconciliations (expense_id, approved_amount, paid_amount, status, payment_reference, reconciled_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [expenseId, approvedAmount, paidAmount, status, paymentRef, reviewerId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXPENSE_RECONCILED', 'EXPENSE_POLICY', $2)`,
      [reviewerId, `Reconciled Expense #${expenseId}: Status ${status}`]
    );

    return res.rows[0];
  }

  async getReconciliations() {
    const res = await dbService.query(
      `SELECT er.*, ex.expense_number, ex.title, e.first_name, e.last_name
       FROM expense_reconciliations er
       JOIN expenses ex ON er.expense_id = ex.id
       JOIN employees e ON ex.employee_id = e.id
       ORDER BY er.reconciled_at DESC`
    );
    return res.rows;
  }

  async lockPeriod(periodName: string, lockBy: number) {
    const res = await dbService.query(
      `INSERT INTO expense_period_locks (period_name, start_date, end_date, is_locked, locked_by, locked_at)
       VALUES ($1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, true, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (period_name) DO UPDATE SET is_locked = true, locked_by = $2, locked_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [periodName, lockBy]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'FINANCIAL_PERIOD_LOCKED', 'EXPENSE_POLICY', $2)`,
      [lockBy, `Locked Financial Period '${periodName}'`]
    );

    return res.rows[0];
  }

  async getPeriodLocks() {
    const res = await dbService.query(`SELECT * FROM expense_period_locks ORDER BY created_at DESC`);
    return res.rows;
  }
}

export const expensePolicyRepository = new ExpensePolicyRepository();
