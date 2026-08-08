import dbService from '../database/db.js';

export interface ProcessPayrollDTO {
  period_name: string;
  start_date: string;
  end_date: string;
}

export class PayrollManagementRepository {

  // ─── Payroll Calculation Engine ────────────────────────────────────────────
  async processPayrollPeriod(dto: ProcessPayrollDTO, creatorId: number) {
    const monthStr = dto.period_name.split(' ')[0] || 'August';
    const yearInt = parseInt(dto.period_name.split(' ')[1] || '2026', 10);

    // Get active employees
    const empRes = await dbService.query(`SELECT id, first_name, last_name, designation FROM employees`);
    const employees = empRes.rows;

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const basic = 40000;
      const hra = 16000;
      const conveyance = 3000;
      const allowances = 11000;
      const gross = basic + hra + conveyance + allowances;

      // Calculate LOP Days & Deduction from leaves
      const lopRes = await dbService.query(
        `SELECT SUM(total_days) as lop_days FROM leaves
         WHERE employee_id = $1 AND status = 'APPROVED'
         AND start_date >= $2 AND end_date <= $3`,
        [emp.id, dto.start_date, dto.end_date]
      );
      const lopDays = Number(lopRes.rows[0]?.lop_days || 0);
      const lopDeduction = Number(((gross / 30) * lopDays).toFixed(2));

      // Calculate PF & PT Deductions
      const pfDeduction = Math.min(1800, Number((basic * 0.12).toFixed(2)));
      const ptDeduction = 200;
      const tdsDeduction = Number((gross * 0.05).toFixed(2));
      const totalDeduct = pfDeduction + ptDeduction + tdsDeduction + lopDeduction;

      // Net Pay
      const netSalary = Math.max(0, Number((gross - totalDeduct).toFixed(2)));

      totalGross += gross;
      totalDeductions += totalDeduct;
      totalNet += netSalary;

      // Insert or Update employee payroll record
      await dbService.query(
        `INSERT INTO payrolls (employee_id, month, year, basic_salary, hra, conveyance, allowances, gross_salary, pf_deduction, esi_deduction, tds_deduction, net_salary, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, 'PAID')
         ON CONFLICT DO NOTHING`,
        [emp.id, monthStr, yearInt, basic, hra, conveyance, allowances, gross, pfDeduction, tdsDeduction, netSalary]
      );
    }

    // Save Payroll Run Summary
    const runRes = await dbService.query(
      `INSERT INTO payroll_runs (period_name, start_date, end_date, status, gross_payroll, total_deductions, net_payroll)
       VALUES ($1, $2, $3, 'PROCESSED', $4, $5, $6)
       ON CONFLICT (period_name)
       DO UPDATE SET gross_payroll = $4, total_deductions = $5, net_payroll = $6, status = 'PROCESSED'
       RETURNING *`,
      [dto.period_name, dto.start_date, dto.end_date, totalGross, totalDeductions, totalNet]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYROLL_PERIOD_PROCESSED', 'PAYROLL', $2)`,
      [creatorId, `Processed Payroll Period '${dto.period_name}': Gross ₹${totalGross}, Net ₹${totalNet}`]
    );

    return runRes.rows[0];
  }

  async getPayrollRuns() {
    const res = await dbService.query(`SELECT * FROM payroll_runs ORDER BY created_at DESC`);
    return res.rows;
  }

  async getPayrollRecords(month: string, year: number) {
    const res = await dbService.query(
      `SELECT p.*, e.first_name, e.last_name, e.designation
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.month = $1 AND p.year = $2
       ORDER BY p.created_at DESC`,
      [month, year]
    );
    return res.rows;
  }

  // ─── Payroll Locking & Approval ───────────────────────────────────────────
  async lockPayroll(payrollRunId: number, reviewerId: number) {
    const res = await dbService.query(
      `UPDATE payroll_runs SET status = 'LOCKED', locked_by = $1, locked_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [reviewerId, payrollRunId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYROLL_PERIOD_LOCKED', 'PAYROLL', $2)`,
      [reviewerId, `Locked Payroll Run #${payrollRunId}`]
    );

    return res.rows[0];
  }

  // ─── Employee Payslip & IDOR Security Check ───────────────────────────────
  async getEmployeePayslips(employeeId: number, requesterId: number, requesterRole: string) {
    // IDOR Security Enforcement
    const isAuthorized = requesterId === employeeId || ['ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER', 'SUPER_ADMIN'].includes(requesterRole);
    if (!isAuthorized) {
      throw new Error('Unauthorized: You can only access your own payslips');
    }

    const res = await dbService.query(
      `SELECT p.*, e.first_name, e.last_name, e.designation
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.employee_id = $1
       ORDER BY p.year DESC, p.created_at DESC`,
      [employeeId]
    );

    return res.rows;
  }
}

export const payrollManagementRepository = new PayrollManagementRepository();
