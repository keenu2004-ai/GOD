import dbService from '../database/db.js';

export interface ApplyLeaveDTO {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  is_half_day?: boolean;
  reason: string;
}

export class LeaveManagementRepository {

  // ─── Leave Balances & Immutable Ledger ──────────────────────────────────────
  async getLeaveBalances(employeeId: number) {
    const res = await dbService.query(
      `SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.is_paid
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1`,
      [employeeId]
    );

    if (res.rows.length === 0) {
      // Seed default balances for employee if missing
      await dbService.query(`
        INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, remaining_days)
        SELECT $1, id, 12, 12 FROM leave_types
        ON CONFLICT (employee_id, leave_type_id) DO NOTHING
      `, [employeeId]);
      const seeded = await dbService.query(
        `SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.is_paid
         FROM leave_balances lb
         JOIN leave_types lt ON lb.leave_type_id = lt.id
         WHERE lb.employee_id = $1`,
        [employeeId]
      );
      return seeded.rows;
    }

    return res.rows;
  }

  async adjustLeaveBalance(
    employeeId: number,
    leaveTypeId: number,
    amount: number,
    transactionType: string,
    reason: string,
    createdBy: number
  ) {
    const balRes = await dbService.query(
      `SELECT remaining_days FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2`,
      [employeeId, leaveTypeId]
    );

    const openingBalance = Number(balRes.rows[0]?.remaining_days || 12);
    const closingBalance = openingBalance + amount;

    await dbService.query(
      `INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, remaining_days)
       VALUES ($1, $2, 12, $3)
       ON CONFLICT (employee_id, leave_type_id)
       DO UPDATE SET remaining_days = $3, updated_at = CURRENT_TIMESTAMP`,
      [employeeId, leaveTypeId, closingBalance]
    );

    const ledgerRes = await dbService.query(
      `INSERT INTO leave_balance_ledger (employee_id, leave_type_id, transaction_type, amount, opening_balance, closing_balance, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [employeeId, leaveTypeId, transactionType, amount, openingBalance, closingBalance, reason, createdBy]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'LEAVE_BALANCE_ADJUSTED', 'LEAVE_MANAGEMENT', $2)`,
      [createdBy, `Adjusted Leave Balance for Employee #${employeeId}: ${transactionType} ${amount} days. New Balance: ${closingBalance}`]
    );

    return ledgerRes.rows[0];
  }

  async getBalanceLedger(employeeId: number) {
    const res = await dbService.query(
      `SELECT lbl.*, lt.name as leave_type_name, e.first_name, e.last_name
       FROM leave_balance_ledger lbl
       JOIN leave_types lt ON lbl.leave_type_id = lt.id
       LEFT JOIN employees e ON lbl.created_by = e.id
       WHERE lbl.employee_id = $1
       ORDER BY lbl.created_at DESC`,
      [employeeId]
    );
    return res.rows;
  }

  // ─── Leave Application & Overlap Validation ──────────────────────────────
  async applyLeave(dto: ApplyLeaveDTO) {
    // Check overlap with existing approved leaves
    const overlapRes = await dbService.query(
      `SELECT * FROM leaves
       WHERE employee_id = $1 AND status = 'APPROVED'
       AND (start_date <= $3 AND end_date >= $2)`,
      [dto.employee_id, dto.start_date, dto.end_date]
    );

    if (overlapRes.rows.length > 0) {
      throw new Error('Overlapping approved leave exists for the selected date range');
    }

    // Calculate requested duration
    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const requestedDays = dto.is_half_day ? 0.5 : diffDays;

    // Check available balance
    const balRes = await dbService.query(
      `SELECT remaining_days FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2`,
      [dto.employee_id, dto.leave_type_id]
    );
    const availableBalance = Number(balRes.rows[0]?.remaining_days || 0);

    const paidDays = Math.min(requestedDays, availableBalance);
    const lopDays = Math.max(0, requestedDays - paidDays);

    const res = await dbService.query(
      `INSERT INTO leaves (employee_id, leave_type_id, start_date, end_date, total_days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
      [dto.employee_id, dto.leave_type_id, dto.start_date, dto.end_date, requestedDays, dto.reason]
    );

    return {
      leave: res.rows[0],
      requested_days: requestedDays,
      paid_days: paidDays,
      lop_days: lopDays,
    };
  }

  async getApplications(employeeId: number) {
    const res = await dbService.query(
      `SELECT l.*, lt.name as leave_type_name, e.first_name, e.last_name
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       JOIN employees e ON l.employee_id = e.id
       ORDER BY l.created_at DESC`
    );
    return res.rows;
  }

  async approveLeave(leaveId: number, reviewerId: number) {
    const leaveRes = await dbService.query(`SELECT * FROM leaves WHERE id = $1`, [leaveId]);
    const leave = leaveRes.rows[0];
    if (!leave) throw new Error('Leave request not found');

    await dbService.query(`UPDATE leaves SET status = 'APPROVED' WHERE id = $1`, [leaveId]);

    // Deduct balance and write ledger
    await this.adjustLeaveBalance(
      leave.employee_id,
      leave.leave_type_id,
      -Number(leave.total_days),
      'LEAVE_TAKEN',
      `Approved Leave Application #${leaveId}`,
      reviewerId
    );

    return { message: 'Leave application approved successfully' };
  }

  async cancelLeave(leaveId: number, userId: number) {
    const leaveRes = await dbService.query(`SELECT * FROM leaves WHERE id = $1`, [leaveId]);
    const leave = leaveRes.rows[0];
    if (!leave) throw new Error('Leave request not found');

    await dbService.query(`UPDATE leaves SET status = 'CANCELLED' WHERE id = $1`, [leaveId]);

    if (leave.status === 'APPROVED') {
      // Restore balance
      await this.adjustLeaveBalance(
        leave.employee_id,
        leave.leave_type_id,
        Number(leave.total_days),
        'CANCELLATION',
        `Cancelled Approved Leave Application #${leaveId}`,
        userId
      );
    }

    return { message: 'Leave application cancelled' };
  }
}

export const leaveManagementRepository = new LeaveManagementRepository();
