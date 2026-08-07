import dbService from '../database/db.js';

export interface SetBudgetDTO {
  department_id: number;
  year: number;
  annual_budget: number;
}

export class PayrollAnalyticsRepository {

  // ─── Executive BI KPIs ───────────────────────────────────────────────────
  async getExecutiveKPIs() {
    const [empRes, salRes, runRes, bonRes, claimRes, loanRes] = await Promise.all([
      dbService.query(`SELECT COUNT(*) as count FROM employees WHERE is_deleted = false`),
      dbService.query(`SELECT COALESCE(SUM(annual_ctc), 0) as total_ctc, COALESCE(AVG(annual_ctc), 0) as avg_ctc FROM employee_salary_assignments WHERE is_active = true`),
      dbService.query(`SELECT COALESCE(SUM(total_net), 0) as total_net, COALESCE(SUM(total_gross), 0) as total_gross FROM payroll_runs`),
      dbService.query(`SELECT COALESCE(SUM(bonus_amount), 0) as total FROM employee_bonuses WHERE status = 'APPROVED'`),
      dbService.query(`SELECT COALESCE(SUM(claim_amount), 0) as total FROM reimbursement_requests WHERE status = 'PAID'`),
      dbService.query(`SELECT COALESCE(SUM(total_repaid), 0) as total FROM employee_loans WHERE status = 'APPROVED'`),
    ]);

    const activeHeadcount = parseInt(empRes.rows[0]?.count || '0', 10);
    const totalCTC = parseFloat(salRes.rows[0]?.total_ctc || '0');
    const avgCTC = parseFloat(salRes.rows[0]?.avg_ctc || '0');
    const totalNetDisbursed = parseFloat(runRes.rows[0]?.total_net || '0');
    const totalGrossPayroll = parseFloat(runRes.rows[0]?.total_gross || '0');
    const totalBonuses = parseFloat(bonRes.rows[0]?.total || '0');
    const totalClaims = parseFloat(claimRes.rows[0]?.total || '0');
    const totalLoanRecovery = parseFloat(loanRes.rows[0]?.total || '0');

    return {
      active_headcount: activeHeadcount,
      total_annual_ctc: totalCTC,
      average_ctc: avgCTC,
      total_net_disbursed: totalNetDisbursed,
      total_gross_payroll: totalGrossPayroll,
      total_bonuses_paid: totalBonuses,
      total_claims_disbursed: totalClaims,
      total_loan_recovery: totalLoanRecovery,
    };
  }

  // ─── Departmental & Branch Cost Distribution ─────────────────────────────
  async getDepartmentCostBreakup() {
    const res = await dbService.query(
      `SELECT d.id as department_id, d.name as department_name,
              COUNT(e.id) as headcount,
              COALESCE(SUM(sa.monthly_gross), 0) as monthly_cost,
              COALESCE(SUM(sa.annual_ctc), 0) as annual_cost,
              COALESCE(pb.annual_budget, 0) as department_budget
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id AND e.is_deleted = false
       LEFT JOIN employee_salary_assignments sa ON e.id = sa.employee_id AND sa.is_active = true
       LEFT JOIN payroll_budgets pb ON d.id = pb.department_id
       GROUP BY d.id, d.name, pb.annual_budget
       ORDER BY monthly_cost DESC`
    );
    return res.rows;
  }

  async getBranchCostBreakup() {
    const res = await dbService.query(
      `SELECT b.id as branch_id, b.name as branch_name,
              COUNT(e.id) as headcount,
              COALESCE(SUM(sa.monthly_gross), 0) as monthly_cost,
              COALESCE(SUM(sa.annual_ctc), 0) as annual_cost
       FROM branches b
       LEFT JOIN employees e ON b.id = e.branch_id AND e.is_deleted = false
       LEFT JOIN employee_salary_assignments sa ON e.id = sa.employee_id AND sa.is_active = true
       GROUP BY b.id, b.name
       ORDER BY monthly_cost DESC`
    );
    return res.rows;
  }

  // ─── 12-Month Payroll Cost Trend ─────────────────────────────────────────
  async get12MonthPayrollTrend() {
    const res = await dbService.query(
      `SELECT month, year, total_gross, total_deductions, total_net, total_employees, status
       FROM payroll_runs
       ORDER BY year ASC, id ASC
       LIMIT 12`
    );
    return res.rows;
  }

  // ─── Predictive Payroll Forecasting Engine ───────────────────────────────
  async getPredictivePayrollForecast() {
    const salRes = await dbService.query(
      `SELECT COALESCE(SUM(monthly_gross), 0) as monthly_gross, COALESCE(SUM(annual_ctc), 0) as annual_ctc
       FROM employee_salary_assignments WHERE is_active = true`
    );

    const baseMonthlyGross = parseFloat(salRes.rows[0]?.monthly_gross || '0');
    const baseAnnualCTC = parseFloat(salRes.rows[0]?.annual_ctc || '0');

    // 3% projected growth for upcoming increments / new hires
    const growthFactor = 1.03;
    const nextMonthForecast = Math.round(baseMonthlyGross * growthFactor);
    const nextQuarterForecast = Math.round(baseMonthlyGross * 3 * growthFactor);
    const annualForecast = Math.round(baseAnnualCTC * growthFactor);

    return {
      current_monthly_run_rate: baseMonthlyGross,
      next_month_forecast: nextMonthForecast,
      next_quarter_forecast: nextQuarterForecast,
      annual_forecast: annualForecast,
      growth_assumption_pct: 3.0,
    };
  }

  // ─── Departmental Budget Manager ─────────────────────────────────────────
  async setDepartmentBudget(dto: SetBudgetDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO payroll_budgets (department_id, year, annual_budget, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (department_id) DO UPDATE SET
         annual_budget = EXCLUDED.annual_budget,
         year = EXCLUDED.year,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [dto.department_id, dto.year, dto.annual_budget, creatorId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYROLL_BUDGET_SET', 'PAYROLL_ANALYTICS', $2)`,
      [creatorId, `Set annual budget of ₹${dto.annual_budget} for Department #${dto.department_id}`]
    );

    return res.rows[0];
  }

  async getDepartmentBudgets(year = 2026) {
    const res = await dbService.query(
      `SELECT pb.*, d.name as department_name
       FROM payroll_budgets pb
       JOIN departments d ON pb.department_id = d.id
       WHERE pb.year = $1
       ORDER BY d.name ASC`,
      [year]
    );
    return res.rows;
  }
}

export const payrollAnalyticsRepository = new PayrollAnalyticsRepository();
