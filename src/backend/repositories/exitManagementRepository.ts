import dbService from '../database/db.js';

export interface SubmitResignationDTO {
  employee_id: number;
  resignation_date: string;
  last_working_day: string;
  notice_period_days?: number;
  reason: string;
}

export interface DepartmentClearanceDTO {
  resignation_id: number;
  department: 'HR' | 'FINANCE' | 'IT' | 'ADMIN' | 'MANAGER';
  comments?: string;
}

export class ExitManagementRepository {

  // ─── Resignation & Offboarding Engine ─────────────────────────────────────
  async submitResignation(dto: SubmitResignationDTO) {
    return await dbService.transaction(async (client) => {
      const res = await client.query(
        `INSERT INTO employee_resignations (
          employee_id, resignation_date, last_working_day, notice_period_days, reason, status
        ) VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
        [dto.employee_id, dto.resignation_date, dto.last_working_day, dto.notice_period_days || 30, dto.reason]
      );
      const reg = res.rows[0];

      // Pre-seed 5 departmental clearances
      const depts = ['HR', 'FINANCE', 'IT', 'ADMIN', 'MANAGER'];
      for (const d of depts) {
        await client.query(
          `INSERT INTO exit_department_clearances (resignation_id, department, status)
           VALUES ($1, $2, 'PENDING') ON CONFLICT DO NOTHING`,
          [reg.id, d]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'RESIGNATION_SUBMITTED', 'EXIT_MANAGEMENT', $2)`,
        [dto.employee_id, `Submitted resignation. Last Working Day: ${dto.last_working_day}`]
      );

      return reg;
    });
  }

  async approveResignation(resignationId: number, approverId: number) {
    const res = await dbService.query(
      `UPDATE employee_resignations
       SET status = 'APPROVED', hr_approved = true, manager_approved = true, approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [approverId, resignationId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'RESIGNATION_APPROVED', 'EXIT_MANAGEMENT', $2)`,
      [approverId, `Approved resignation #${resignationId}`]
    );

    return res.rows[0];
  }

  async getResignations(employeeId?: number) {
    let sql = `
      SELECT er.*, e.first_name, e.last_name, e.employee_code, d.name as department_name
      FROM employee_resignations er
      JOIN employees e ON er.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE er.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY er.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Departmental Clearances Engine ───────────────────────────────────────
  async clearDepartment(dto: DepartmentClearanceDTO, clearedById: number) {
    const res = await dbService.query(
      `UPDATE exit_department_clearances
       SET status = 'CLEARED', comments = $1, cleared_by = $2, cleared_at = CURRENT_TIMESTAMP
       WHERE resignation_id = $3 AND department = $4 RETURNING *`,
      [dto.comments || null, clearedById, dto.resignation_id, dto.department]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EXIT_CLEARANCE_COMPLETED', 'EXIT_MANAGEMENT', $2)`,
      [clearedById, `Cleared ${dto.department} department for resignation #${dto.resignation_id}`]
    );

    return res.rows[0];
  }

  async getClearances(resignationId: number) {
    const res = await dbService.query(
      `SELECT edc.*, e.first_name as cleared_by_first, e.last_name as cleared_by_last
       FROM exit_department_clearances edc
       LEFT JOIN employees e ON edc.cleared_by = e.id
       WHERE edc.resignation_id = $1`,
      [resignationId]
    );
    return res.rows;
  }

  // ─── Full & Final (FnF) Settlement Engine ─────────────────────────────────
  async calculateFnFSettlement(resignationId: number, creatorId: number) {
    const regRes = await dbService.query(`SELECT * FROM employee_resignations WHERE id = $1`, [resignationId]);
    const reg = regRes.rows[0];
    if (!reg) throw new Error('Resignation record not found');

    const empId = reg.employee_id;

    // Fetch active salary assignment
    const salRes = await dbService.query(
      `SELECT monthly_gross, basic_salary FROM employee_salary_assignments WHERE employee_id = $1 AND is_active = true`,
      [empId]
    );
    const sal = salRes.rows[0];
    const monthlyGross = sal ? parseFloat(sal.monthly_gross) : 50000;
    const dailyRate = Math.round((monthlyGross / 22) * 100) / 100;

    // Pending salary (e.g., 15 worked days in final month)
    const pendingSalary = Math.round(dailyRate * 15 * 100) / 100;

    // Fetch remaining leave balance for Leave Encashment
    const leaveRes = await dbService.query(
      `SELECT balance FROM leave_balances WHERE employee_id = $1 LIMIT 1`,
      [empId]
    );
    const leaveBal = leaveRes.rows[0] ? parseFloat(leaveRes.rows[0].balance) : 10;
    const leaveEncashment = Math.round(dailyRate * leaveBal * 100) / 100;

    // Active loan outstanding balance deduction
    const loanRes = await dbService.query(
      `SELECT COALESCE(SUM(outstanding_balance), 0) as loan_bal FROM employee_loans WHERE employee_id = $1 AND status = 'APPROVED'`,
      [empId]
    );
    const loanBalDeduction = parseFloat(loanRes.rows[0]?.loan_bal || '0');

    const netSettlement = Math.max(0, Math.round((pendingSalary + leaveEncashment - loanBalDeduction) * 100) / 100);

    const fnfRes = await dbService.query(
      `INSERT INTO fnf_settlements (
        resignation_id, employee_id, pending_salary, leave_encashment, bonus_payout, asset_recovery_deduction,
        loan_balance_deduction, notice_shortfall_deduction, net_settlement_amount, status, created_by
      ) VALUES ($1, $2, $3, $4, 0, 0, $5, 0, $6, 'PREVIEW', $7)
      ON CONFLICT DO NOTHING RETURNING *`,
      [resignationId, empId, pendingSalary, leaveEncashment, loanBalDeduction, netSettlement, creatorId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'FNF_SETTLEMENT_CALCULATED', 'EXIT_MANAGEMENT', $2)`,
      [creatorId, `Calculated FnF Settlement for Resignation #${resignationId}: Net ₹${netSettlement}`]
    );

    return fnfRes.rows[0] || (await dbService.query(`SELECT * FROM fnf_settlements WHERE resignation_id = $1`, [resignationId])).rows[0];
  }

  async approveFnFSettlement(settlementId: number, approverId: number) {
    const res = await dbService.query(
      `UPDATE fnf_settlements
       SET status = 'SETTLED', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [approverId, settlementId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'FNF_SETTLEMENT_APPROVED', 'EXIT_MANAGEMENT', $2)`,
      [approverId, `Approved FnF Settlement #${settlementId}`]
    );

    return res.rows[0];
  }

  async getFnFSettlement(resignationId: number) {
    const res = await dbService.query(
      `SELECT fnf.*, e.first_name, e.last_name, e.employee_code
       FROM fnf_settlements fnf
       JOIN employees e ON fnf.employee_id = e.id
       WHERE fnf.resignation_id = $1`,
      [resignationId]
    );
    return res.rows[0] || null;
  }
}

export const exitManagementRepository = new ExitManagementRepository();
