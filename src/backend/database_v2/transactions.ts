import { dbConnectionV2 } from './connection.js';

export class EnterpriseTransactionService {
  /**
   * Atomic Employee Onboarding: Creates Employee, Assigns Salary Structure, Sets Initial Leave Balances, and Creates Default System User
   */
  async processEmployeeOnboarding(data: {
    employee_code: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    department_id: number;
    designation_id: number;
    branch_id: number;
    joining_date: string;
    salary_amount: number;
    role: string;
  }) {
    return await dbConnectionV2.transaction(async (tx) => {
      // 1. Create Employee
      const empRes = await tx.query(
        `INSERT INTO employees (
          employee_code, email, password_hash, first_name, last_name, 
          department_id, designation_id, branch_id, joining_date, salary_amount, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          data.employee_code, data.email, data.password_hash, data.first_name, data.last_name,
          data.department_id, data.designation_id, data.branch_id, data.joining_date, data.salary_amount, data.role
        ]
      );

      const employeeId = empRes.rows[0].id;

      // 2. Create Initial Salary Structure
      const basicPay = data.salary_amount * 0.5;
      const hra = data.salary_amount * 0.3;
      const specialAllow = data.salary_amount * 0.2;

      await tx.query(
        `INSERT INTO salary_structures (
          employee_id, basic_salary, hra, special_allowance, gross_salary, effective_from
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [employeeId, basicPay, hra, specialAllow, data.salary_amount, data.joining_date]
      );

      // 3. Allocate Initial Standard Leave Balances
      const leaveTypesRes = await tx.query(`SELECT id, max_days_per_year FROM leave_types WHERE deleted_at IS NULL`);
      const currentYear = new Date().getFullYear();

      for (const lt of leaveTypesRes.rows) {
        await tx.query(
          `INSERT INTO leave_balances (
            employee_id, leave_type_id, total_allocated, used_days, remaining_days, year
          ) VALUES ($1, $2, $3, 0, $3, $4)`,
          [employeeId, lt.id, lt.max_days_per_year, currentYear]
        );
      }

      // 4. Log Audit Event
      await tx.query(
        `INSERT INTO audit_logs (employee_id, action, module, details) VALUES ($1, 'CREATE', 'EMPLOYEE_ONBOARDING', $2)`,
        [employeeId, `Onboarded ${data.first_name} ${data.last_name} (${data.employee_code})`]
      );

      return { success: true, employeeId };
    });
  }

  /**
   * Atomic Leave Approval with automatic balance deduction
   */
  async approveLeaveRequest(leaveRequestId: number, approverId: number, comments: string) {
    return await dbConnectionV2.transaction(async (tx) => {
      // 1. Fetch Leave Request
      const reqRes = await tx.query(
        `SELECT employee_id, leave_type_id, total_days, status FROM leave_requests WHERE id = $1 FOR UPDATE`,
        [leaveRequestId]
      );

      if (reqRes.rows.length === 0) {
        throw new Error('Leave request not found');
      }

      const req = reqRes.rows[0];

      // 2. Lock & Check Balance
      const currentYear = new Date().getFullYear();
      const balRes = await tx.query(
        `SELECT id, remaining_days, used_days FROM leave_balances 
         WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3 FOR UPDATE`,
        [req.employee_id, req.leave_type_id, currentYear]
      );

      if (balRes.rows.length === 0) {
        throw new Error('Leave balance not found for employee');
      }

      const bal = balRes.rows[0];
      if (bal.remaining_days < req.total_days) {
        throw new Error(`Insufficient leave balance. Remaining: ${bal.remaining_days}, Requested: ${req.total_days}`);
      }

      // 3. Update Leave Request Status
      await tx.query(
        `UPDATE leave_requests SET status = 'APPROVED', approver_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [approverId, leaveRequestId]
      );

      // 4. Update Leave Balance
      const newRemaining = bal.remaining_days - req.total_days;
      const newUsed = Number(bal.used_days) + Number(req.total_days);

      await tx.query(
        `UPDATE leave_balances SET remaining_days = $1, used_days = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [newRemaining, newUsed, bal.id]
      );

      // 5. Insert Approval Record
      await tx.query(
        `INSERT INTO leave_approvals (leave_request_id, approver_id, action, comments) VALUES ($1, $2, 'APPROVED', $3)`,
        [leaveRequestId, approverId, comments]
      );

      return { success: true, newRemaining };
    });
  }
}

export const transactionService = new EnterpriseTransactionService();
export default transactionService;
