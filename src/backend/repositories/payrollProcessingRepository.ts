import dbService from '../database/db.js';

export interface ProcessPayrollDTO {
  month: string; // e.g. "August"
  year: number;
}

export interface ApprovePayrollDTO {
  run_id: number;
  level: 'PAYROLL_MANAGER' | 'FINANCE_MANAGER' | 'HR_MANAGER' | 'SUPER_ADMIN';
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export interface PayrollAdjustmentDTO {
  run_id?: number;
  employee_id: number;
  adjustment_type: 'BONUS' | 'ARREARS' | 'DEDUCTION_CORRECTION' | 'MANUAL';
  amount: number;
  reason: string;
}

export class PayrollProcessingRepository {

  // ─── Automated Payroll Processing & Multi-Module Calculation Engine ───────
  async generatePayrollRun(dto: ProcessPayrollDTO, creatorId: number) {
    return await dbService.transaction(async (client) => {
      // 1. Check if period is locked
      const lockRes = await client.query(
        `SELECT is_locked FROM payroll_lock_periods WHERE month = $1 AND year = $2`,
        [dto.month, dto.year]
      );
      if (lockRes.rows[0]?.is_locked) {
        throw new Error(`Payroll for ${dto.month} ${dto.year} is LOCKED and cannot be modified.`);
      }

      // 2. Create or Upsert Header
      const runRes = await client.query(
        `INSERT INTO payroll_runs (month, year, status, created_by, updated_by)
         VALUES ($1, $2, 'PREVIEW', $3, $3)
         ON CONFLICT (month, year) DO UPDATE SET updated_by = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [dto.month, dto.year, creatorId]
      );
      const run = runRes.rows[0];

      // Delete existing run items for recalculation
      await client.query(`DELETE FROM payroll_run_items WHERE run_id = $1`, [run.id]);

      // 3. Fetch active employees
      const empsRes = await client.query(`SELECT id, first_name, last_name, employee_code FROM employees WHERE is_deleted = false`);
      const employees = empsRes.rows;

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let processedCount = 0;

      for (const emp of employees) {
        // Fetch Salary Assignment
        const salRes = await client.query(
          `SELECT * FROM employee_salary_assignments WHERE employee_id = $1 AND is_active = true`,
          [emp.id]
        );
        const sal = salRes.rows[0];
        const warnings: string[] = [];

        if (!sal) {
          warnings.push('MISSING_SALARY_STRUCTURE');
        }

        const basic = sal ? parseFloat(sal.basic_salary) : 0;
        const hra = sal ? parseFloat(sal.hra) : 0;
        const special = sal ? parseFloat(sal.special_allowance) : 0;
        const baseMonthlyGross = sal ? parseFloat(sal.monthly_gross) : 0;

        // Fetch Attendance stats
        const workingDays = 22;
        const presRes = await client.query(
          `SELECT COUNT(*) as cnt FROM attendance WHERE employee_id = $1 AND status IN ('PRESENT', 'LATE')`,
          [emp.id]
        );
        const presentDays = Math.min(workingDays, parseInt(presRes.rows[0]?.cnt || '22', 10));
        const absentDays = workingDays - presentDays;

        // Fetch Loss Of Pay (LOP) Days from Leave
        const lopRes = await client.query(
          `SELECT COALESCE(SUM(la.total_days), 0) as lop_days
           FROM leave_applications la
           JOIN leave_types lt ON la.leave_type_id = lt.id
           WHERE la.employee_id = $1 AND la.status = 'APPROVED' AND lt.is_paid = false AND la.deleted_at IS NULL`,
          [emp.id]
        );
        const lopDays = parseFloat(lopRes.rows[0]?.lop_days || '0');

        // Prorated Gross calculation based on LOP
        const lopDeduction = lopDays > 0 ? Math.round(((baseMonthlyGross / workingDays) * lopDays) * 100) / 100 : 0;
        const proratedGross = Math.max(0, baseMonthlyGross - lopDeduction);

        // Fetch Approved Reimbursements (Expenses)
        const expRes = await client.query(
          `SELECT COALESCE(SUM(amount), 0) as total_exp FROM expenses WHERE employee_id = $1 AND status = 'APPROVED'`,
          [emp.id]
        );
        const reimbursements = parseFloat(expRes.rows[0]?.total_exp || '0');

        // Fetch Active Loan EMI Recovery
        const loanRes = await client.query(
          `SELECT COALESCE(SUM(emi_amount), 0) as total_emi FROM employee_loans WHERE employee_id = $1 AND status = 'APPROVED' AND outstanding_balance > 0`,
          [emp.id]
        );
        const loanDeduction = parseFloat(loanRes.rows[0]?.total_emi || '0');

        // Fetch Active Salary Advance Recovery
        const advRes = await client.query(
          `SELECT COALESCE(SUM(monthly_deduction), 0) as total_adv FROM employee_salary_advances WHERE employee_id = $1 AND status = 'APPROVED' AND outstanding_balance > 0`,
          [emp.id]
        );
        const advanceDeduction = parseFloat(advRes.rows[0]?.total_adv || '0');

        // Statutory Deductions
        const pf = sal ? parseFloat(sal.pf_deduction) : 0;
        const pt = sal ? parseFloat(sal.pt_deduction) : 0;
        const esi = sal ? parseFloat(sal.esi_deduction) : 0;
        const totalEmpDeduction = pf + pt + esi + loanDeduction + advanceDeduction;

        const netSalary = Math.max(0, Math.round((proratedGross + reimbursements - totalEmpDeduction) * 100) / 100);

        // Insert Item
        await client.query(
          `INSERT INTO payroll_run_items (
            run_id, employee_id, basic_salary, hra, special_allowance, overtime_pay, night_shift_pay, bonus, reimbursements,
            gross_salary, pf_deduction, pt_deduction, esi_deduction, tds_deduction, loan_deduction, advance_deduction, lop_deduction,
            arrears, net_salary, working_days, present_days, absent_days, lop_days, ot_hours, warning_flags
          ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0, $6, $7, $8, $9, $10, 0, $11, $12, $13, 0, $14, $15, $16, $17, $18, 0, $19)`,
          [
            run.id, emp.id, basic, hra, special, reimbursements, proratedGross, pf, pt, esi,
            loanDeduction, advanceDeduction, lopDeduction, netSalary, workingDays, presentDays, absentDays, lopDays,
            warnings.join(',') || null
          ]
        );

        totalGross += proratedGross;
        totalDeductions += totalEmpDeduction;
        totalNet += netSalary;
        processedCount++;
      }

      // Update Run Totals
      const updatedRunRes = await client.query(
        `UPDATE payroll_runs
         SET total_gross = $1, total_deductions = $2, total_net = $3, total_employees = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 RETURNING *`,
        [totalGross, totalDeductions, totalNet, processedCount, run.id]
      );

      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'PAYROLL_RUN_GENERATED', 'PAYROLL_ENGINE', $2)`,
        [creatorId, `Generated payroll preview for ${dto.month} ${dto.year}: ${processedCount} employees, Total Net: ₹${totalNet}`]
      );

      return updatedRunRes.rows[0];
    });
  }

  // ─── Get Payroll Run Preview & Details ───────────────────────────────────
  async getPayrollRunDetails(month: string, year: number) {
    const runRes = await dbService.query(`SELECT * FROM payroll_runs WHERE month = $1 AND year = $2`, [month, year]);
    const run = runRes.rows[0];
    if (!run) return null;

    const itemsRes = await dbService.query(
      `SELECT pri.*, e.first_name, e.last_name, e.employee_code, d.name as department_name
       FROM payroll_run_items pri
       JOIN employees e ON pri.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE pri.run_id = $1
       ORDER BY e.first_name ASC`,
      [run.id]
    );

    const approvalsRes = await dbService.query(
      `SELECT pa.*, e.first_name as approver_first, e.last_name as approver_last
       FROM payroll_approvals pa
       JOIN employees e ON pa.approver_id = e.id
       WHERE pa.run_id = $1 ORDER BY pa.created_at ASC`,
      [run.id]
    );

    return { run, items: itemsRes.rows, approvals: approvalsRes.rows };
  }

  // ─── Multi-Level Approval Engine ──────────────────────────────────────────
  async approvePayrollRun(dto: ApprovePayrollDTO, approverId: number) {
    return await dbService.transaction(async (client) => {
      await client.query(
        `INSERT INTO payroll_approvals (run_id, approver_id, level, status, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [dto.run_id, approverId, dto.level, dto.status, dto.comment || null]
      );

      let nextStatus = 'SUBMITTED';
      if (dto.level === 'HR_MANAGER' || dto.level === 'FINANCE_MANAGER') {
        nextStatus = 'APPROVED';
      }
      if (dto.level === 'SUPER_ADMIN') {
        nextStatus = 'LOCKED';
      }

      const runRes = await client.query(
        `UPDATE payroll_runs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [nextStatus, dto.run_id]
      );
      const run = runRes.rows[0];

      // If Super Admin approves, lock period
      if (dto.level === 'SUPER_ADMIN' && dto.status === 'APPROVED') {
        await client.query(
          `INSERT INTO payroll_lock_periods (month, year, is_locked, locked_by, reason)
           VALUES ($1, $2, true, $3, 'Super Admin Payroll Approval')
           ON CONFLICT (month, year) DO UPDATE SET is_locked = true, locked_by = $3, updated_at = CURRENT_TIMESTAMP`,
          [run.month, run.year, approverId]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'PAYROLL_RUN_APPROVED', 'PAYROLL_ENGINE', $2)`,
        [approverId, `Approved payroll run #${dto.run_id} at level ${dto.level}`]
      );

      return run;
    });
  }

  // ─── Lock & Unlock Manager ───────────────────────────────────────────────
  async unlockPayrollPeriod(month: string, year: number, reason: string, adminId: number) {
    const res = await dbService.query(
      `UPDATE payroll_lock_periods
       SET is_locked = false, unlocked_by = $1, unlocked_at = CURRENT_TIMESTAMP, reason = $2
       WHERE month = $3 AND year = $4 RETURNING *`,
      [adminId, reason, month, year]
    );

    await dbService.query(
      `UPDATE payroll_runs SET status = 'SUBMITTED' WHERE month = $1 AND year = $2`,
      [month, year]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYROLL_PERIOD_UNLOCKED', 'PAYROLL_ENGINE', $2)`,
      [adminId, `Unlocked payroll for ${month} ${year}: ${reason}`]
    );

    return res.rows[0];
  }

  // ─── Retroactive Adjustments & Arrears ────────────────────────────────────
  async addAdjustment(dto: PayrollAdjustmentDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO payroll_adjustments (run_id, employee_id, adjustment_type, amount, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [dto.run_id || null, dto.employee_id, dto.adjustment_type, dto.amount, dto.reason, creatorId]
    );

    if (dto.run_id) {
      await dbService.query(
        `UPDATE payroll_run_items
         SET bonus = bonus + $1, net_salary = net_salary + $1
         WHERE run_id = $2 AND employee_id = $3`,
        [dto.amount, dto.run_id, dto.employee_id]
      );
    }

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYROLL_ADJUSTMENT_ADDED', 'PAYROLL_ENGINE', $2)`,
      [creatorId, `Added ${dto.adjustment_type} adjustment of ₹${dto.amount} for Employee #${dto.employee_id}`]
    );

    return res.rows[0];
  }
}

export const payrollProcessingRepository = new PayrollProcessingRepository();
