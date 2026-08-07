import dbService from '../database/db.js';

export interface LeaveRequestDTO {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day?: boolean;
  half_day_session?: string;
  reason: string;
  emergency_contact?: string;
  attachment_url?: string;
  status?: string;
}

export class LeaveRepository {
  async getLeaveTypes() {
    const res = await dbService.query(`SELECT * FROM leave_types ORDER BY id ASC`);
    return res.rows;
  }

  async getLeaveBalances(employeeId: number) {
    const res = await dbService.query(
      `SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1`,
      [employeeId]
    );
    return res.rows;
  }

  async getLeaveBalanceForType(employeeId: number, leaveTypeId: number) {
    const res = await dbService.query(
      `SELECT * FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2 LIMIT 1`,
      [employeeId, leaveTypeId]
    );
    return res.rows[0] || null;
  }

  async createLeaveRequest(dto: LeaveRequestDTO) {
    const initialStatus = dto.status || 'MANAGER_PENDING';
    const res = await dbService.query(
      `INSERT INTO leave_applications (
        employee_id, leave_type_id, start_date, end_date, total_days,
        is_half_day, half_day_session, reason, emergency_contact, attachment_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        dto.employee_id,
        dto.leave_type_id,
        dto.start_date,
        dto.end_date,
        dto.total_days,
        dto.is_half_day || false,
        dto.half_day_session || null,
        dto.reason,
        dto.emergency_contact || null,
        dto.attachment_url || null,
        initialStatus,
      ]
    );
    return res.rows[0];
  }

  async updateLeaveRequest(id: number, dto: Partial<LeaveRequestDTO>) {
    const res = await dbService.query(
      `UPDATE leave_applications
       SET leave_type_id = COALESCE($1, leave_type_id),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           total_days = COALESCE($4, total_days),
           is_half_day = COALESCE($5, is_half_day),
           half_day_session = COALESCE($6, half_day_session),
           reason = COALESCE($7, reason),
           emergency_contact = COALESCE($8, emergency_contact),
           attachment_url = COALESCE($9, attachment_url),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        dto.leave_type_id,
        dto.start_date,
        dto.end_date,
        dto.total_days,
        dto.is_half_day,
        dto.half_day_session,
        dto.reason,
        dto.emergency_contact,
        dto.attachment_url,
        id,
      ]
    );
    return res.rows[0];
  }

  async checkOverlap(employeeId: number, startDate: string, endDate: string, excludeId?: number) {
    let sql = `
      SELECT COUNT(*) as count FROM leave_applications
      WHERE employee_id = $1
        AND status IN ('DRAFT', 'SUBMITTED', 'MANAGER_PENDING', 'HR_PENDING', 'APPROVED', 'PENDING')
        AND (
          (start_date <= $2 AND end_date >= $2) OR
          (start_date <= $3 AND end_date >= $3) OR
          (start_date >= $2 AND end_date <= $3)
        )
    `;
    const params: any[] = [employeeId, startDate, endDate];
    if (excludeId) {
      sql += ` AND id != $4`;
      params.push(excludeId);
    }
    const res = await dbService.query(sql, params);
    return parseInt((res.rows[0] as any)?.count || '0', 10) > 0;
  }

  async getAllLeaves(employeeId?: number, status?: string) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (employeeId) {
      conditions.push(`la.employee_id = $${idx}`);
      params.push(employeeId);
      idx++;
    }

    if (status) {
      conditions.push(`la.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await dbService.query(
      `SELECT la.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color,
              e.first_name, e.last_name, e.employee_code, e.avatar_url, d.name as department_name,
              appr.first_name as approver_first_name, appr.last_name as approver_last_name
       FROM leave_applications la
       JOIN leave_types lt ON la.leave_type_id = lt.id
       JOIN employees e ON la.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees appr ON la.approver_id = appr.id
       ${whereClause}
       ORDER BY la.created_at DESC`,
      params
    );
    return res.rows;
  }

  async getLeaveById(id: number) {
    const res = await dbService.query(
      `SELECT la.*, lt.code as leave_type_code
       FROM leave_applications la
       JOIN leave_types lt ON la.leave_type_id = lt.id
       WHERE la.id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async processApprovalWithTransaction(id: number, status: string, approverId: number, rejectionReason?: string) {
    return await dbService.transaction(async (client) => {
      // 1. Lock and get leave request
      const leaveRes = await client.query(
        `SELECT la.*, lt.code as leave_type_code
         FROM leave_applications la
         JOIN leave_types lt ON la.leave_type_id = lt.id
         WHERE la.id = $1 FOR UPDATE`,
        [id]
      );

      const leave = leaveRes.rows[0];
      if (!leave) {
        throw new Error('Leave application not found');
      }

      // 2. Update Leave Application Status
      const updateRes = await client.query(
        `UPDATE leave_applications
         SET status = $1, approver_id = $2, rejection_reason = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, approverId, rejectionReason || null, id]
      );
      const updatedLeave = updateRes.rows[0];

      // 3. Adjust balances atomically
      if (status === 'APPROVED' && leave.status !== 'APPROVED') {
        await client.query(
          `UPDATE leave_balances
           SET used_days = used_days + $1, remaining_days = remaining_days - $1, updated_at = NOW()
           WHERE employee_id = $2 AND leave_type_id = $3`,
          [leave.total_days, leave.employee_id, leave.leave_type_id]
        );

        await client.query(
          `INSERT INTO audit_logs (employee_id, action, module, details)
           VALUES ($1, 'LEAVE_APPROVED', 'LEAVE', $2)`,
          [leave.employee_id, `Leave approved for dates ${leave.start_date} to ${leave.end_date} (-${leave.total_days} days)`]
        );
      } else if (status === 'CANCELLED' && leave.status === 'APPROVED') {
        await client.query(
          `UPDATE leave_balances
           SET used_days = GREATEST(0, used_days - $1), remaining_days = remaining_days + $1, updated_at = NOW()
           WHERE employee_id = $2 AND leave_type_id = $3`,
          [leave.total_days, leave.employee_id, leave.leave_type_id]
        );

        await client.query(
          `INSERT INTO audit_logs (employee_id, action, module, details)
           VALUES ($1, 'LEAVE_CANCELLED', 'LEAVE', $2)`,
          [leave.employee_id, `Leave cancelled for dates ${leave.start_date} to ${leave.end_date} (+${leave.total_days} days restored)`]
        );
      }

      return updatedLeave;
    });
  }

  async updateLeaveStatus(id: number, status: string, approverId: number, rejectionReason?: string) {
    return await this.processApprovalWithTransaction(id, status, approverId, rejectionReason);
  }

  async deductLeaveBalance(employeeId: number, leaveTypeId: number, days: number) {
    await dbService.query(
      `UPDATE leave_balances
       SET used_days = used_days + $1, remaining_days = remaining_days - $1, updated_at = NOW()
       WHERE employee_id = $2 AND leave_type_id = $3`,
      [days, employeeId, leaveTypeId]
    );
  }

  async restoreLeaveBalance(employeeId: number, leaveTypeId: number, days: number) {
    await dbService.query(
      `UPDATE leave_balances
       SET used_days = GREATEST(0, used_days - $1), remaining_days = remaining_days + $1, updated_at = NOW()
       WHERE employee_id = $2 AND leave_type_id = $3`,
      [days, employeeId, leaveTypeId]
    );
  }

  async recordLedgerEntry(employeeId: number, leaveTypeId: number, changeAmount: number, balanceAfter: number, description: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'LEAVE_LEDGER', 'LEAVE', $2)`,
        [employeeId, `LeaveType ${leaveTypeId}: ${description} (${changeAmount > 0 ? '+' : ''}${changeAmount} days, Balance: ${balanceAfter})`]
      );
    } catch (e) {
      console.log(`[LeaveLedger] Emp ${employeeId}: ${description}`);
    }
  }

  async getHolidays() {
    const res = await dbService.query(`SELECT * FROM holidays WHERE is_active = true ORDER BY date ASC`);
    return res.rows;
  }

  async getCalendarLeaves(month: number, year: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const res = await dbService.query(
      `SELECT la.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color,
              e.first_name, e.last_name, e.employee_code, d.name as department_name
       FROM leave_applications la
       JOIN leave_types lt ON la.leave_type_id = lt.id
       JOIN employees e ON la.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE la.status = 'APPROVED'
         AND (la.start_date <= $2 AND la.end_date >= $1)
       ORDER BY la.start_date ASC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // --- Architecture Methods for Carry Forward, Monthly Accrual & Sandwich Rule ---

  async accrueMonthlyBalance(employeeId: number, leaveTypeId: number, accruedDays: number) {
    await dbService.query(
      `UPDATE leave_balances
       SET total_allocated = total_allocated + $1,
           remaining_days = remaining_days + $1,
           updated_at = NOW()
       WHERE employee_id = $2 AND leave_type_id = $3`,
      [accruedDays, employeeId, leaveTypeId]
    );
    await this.recordLedgerEntry(employeeId, leaveTypeId, accruedDays, 0, `Monthly automated accrual (+${accruedDays} days)`);
  }

  async calculateCarryForward(employeeId: number, leaveTypeId: number, maxCarryForwardDays: number) {
    const balance = await this.getLeaveBalanceForType(employeeId, leaveTypeId);
    if (!balance) return 0;

    const unused = Math.max(0, balance.remaining_days);
    const carryDays = Math.min(unused, maxCarryForwardDays);

    await dbService.query(
      `UPDATE leave_balances
       SET remaining_days = $1, total_allocated = $1, used_days = 0, updated_at = NOW()
       WHERE employee_id = $2 AND leave_type_id = $3`,
      [carryDays, employeeId, leaveTypeId]
    );

    await this.recordLedgerEntry(employeeId, leaveTypeId, carryDays, carryDays, `Year-end carry forward (${carryDays} days transferred)`);
    return carryDays;
  }

  async checkSandwichRule(employeeId: number, startDate: string, endDate: string): Promise<boolean> {
    // Sandwich rule: checks if leave bridges across a weekend or holiday
    const holidays = await this.getHolidays();
    const holidayDates = new Set(holidays.map((h: any) => new Date(h.date).toISOString().split('T')[0]));

    const start = new Date(startDate);
    const end = new Date(endDate);

    const prevDay = new Date(start);
    prevDay.setDate(prevDay.getDate() - 1);
    const nextDay = new Date(end);
    nextDay.setDate(nextDay.getDate() + 1);

    const prevStr = prevDay.toISOString().split('T')[0];
    const nextStr = nextDay.toISOString().split('T')[0];

    // If both prev and next dates fall on weekend/holiday, sandwich rule applies
    const isPrevHolidayOrWeekend = prevDay.getDay() === 0 || prevDay.getDay() === 6 || holidayDates.has(prevStr);
    const isNextHolidayOrWeekend = nextDay.getDay() === 0 || nextDay.getDay() === 6 || holidayDates.has(nextStr);

    return isPrevHolidayOrWeekend && isNextHolidayOrWeekend;
  }
  async updateLeaveBalance(employeeId: number, leaveTypeId: number, totalDays: number, remainingDays: number) {
    const res = await dbService.query(
      `INSERT INTO leave_balances (employee_id, leave_type_id, total_days, remaining_days, used_days, year)
       VALUES ($1, $2, $3, $4, GREATEST(0, $3 - $4), EXTRACT(YEAR FROM CURRENT_DATE))
       ON CONFLICT (employee_id, leave_type_id, year)
       DO UPDATE SET total_days = $3, remaining_days = $4, used_days = GREATEST(0, EXCLUDED.total_days - EXCLUDED.remaining_days), updated_at = NOW()
       RETURNING *`,
      [employeeId, leaveTypeId, totalDays, remainingDays]
    );
    return res.rows[0];
  }
}

export const leaveRepository = new LeaveRepository();
