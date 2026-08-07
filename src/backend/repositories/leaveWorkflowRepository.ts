import dbService from '../database/db.js';

export interface SubmitLeaveWorkflowDTO {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day?: boolean;
  half_day_session?: string;
  is_hourly?: boolean;
  hours_requested?: number;
  reason: string;
  emergency_contact?: string;
  contact_during_leave?: string;
  work_handover?: string;
  replacement_employee_id?: number;
  attachment_url?: string;
}

export class LeaveWorkflowRepository {

  // ─── Conflict Detection Engine ───────────────────────────────────────────
  async detectConflicts(employeeId: number, startDate: string, endDate: string, excludeLeaveId?: number) {
    const conflicts: Array<{ type: string; description: string; severity: 'WARNING' | 'CRITICAL' }> = [];

    // 1. Overlapping leave for same employee
    let dupSql = `
      SELECT id, start_date, end_date, status FROM leave_applications
      WHERE employee_id = $1 AND deleted_at IS NULL
        AND status IN ('MANAGER_PENDING', 'HR_PENDING', 'APPROVED', 'SUBMITTED')
        AND (start_date <= $3 AND end_date >= $2)
    `;
    const params: any[] = [employeeId, startDate, endDate];
    if (excludeLeaveId) {
      dupSql += ` AND id != $4`;
      params.push(excludeLeaveId);
    }
    const dupRes = await dbService.query(dupSql, params);
    if (dupRes.rows.length > 0) {
      conflicts.push({
        type: 'OVERLAPPING_REQUEST',
        description: `Employee already has an active/approved leave request (#${dupRes.rows[0].id}) between ${dupRes.rows[0].start_date} and ${dupRes.rows[0].end_date}.`,
        severity: 'CRITICAL',
      });
    }

    // 2. Department team overlap threshold (>30% of team on leave)
    const empRes = await dbService.query(`SELECT department_id, branch_id FROM employees WHERE id = $1`, [employeeId]);
    const emp = empRes.rows[0];

    if (emp?.department_id) {
      const teamSizeRes = await dbService.query(
        `SELECT COUNT(*) as total FROM employees WHERE department_id = $1 AND is_deleted = false AND status = 'ACTIVE'`,
        [emp.department_id]
      );
      const teamSize = parseInt(teamSizeRes.rows[0]?.total || '0', 10);

      const teamOnLeaveRes = await dbService.query(
        `SELECT COUNT(DISTINCT la.employee_id) as count
         FROM leave_applications la
         JOIN employees e ON la.employee_id = e.id
         WHERE e.department_id = $1 AND la.employee_id != $2
           AND la.status = 'APPROVED' AND la.deleted_at IS NULL
           AND (la.start_date <= $4 AND la.end_date >= $3)`,
        [emp.department_id, employeeId, startDate, endDate]
      );
      const onLeaveCount = parseInt(teamOnLeaveRes.rows[0]?.count || '0', 10);
      if (teamSize > 0 && (onLeaveCount / teamSize) >= 0.3) {
        conflicts.push({
          type: 'DEPARTMENT_MIN_STAFFING',
          description: `High department leave volume: ${onLeaveCount}/${teamSize} team members already approved for leave during this period.`,
          severity: 'WARNING',
        });
      }
    }

    // 3. Holiday / Weekend Overlap
    const holRes = await dbService.query(
      `SELECT name, date FROM holidays WHERE date >= $1 AND date <= $2 AND is_active = true`,
      [startDate, endDate]
    );
    if (holRes.rows.length > 0) {
      conflicts.push({
        type: 'HOLIDAY_OVERLAP',
        description: `Selected date range overlaps with official holiday(s): ${holRes.rows.map(h => h.name).join(', ')}.`,
        severity: 'WARNING',
      });
    }

    return conflicts;
  }

  // ─── Team Availability Engine ─────────────────────────────────────────────
  async getTeamAvailability(managerId: number, startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        e.id as employee_id, e.first_name, e.last_name, e.employee_code, e.avatar_url,
        d.name as department_name,
        la.id as active_leave_id, la.start_date, la.end_date, la.status as leave_status,
        lt.name as leave_type_name, lt.color as leave_type_color
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN leave_applications la ON la.employee_id = e.id AND la.deleted_at IS NULL
         AND la.status IN ('APPROVED', 'MANAGER_PENDING', 'HR_PENDING')
         AND (la.start_date <= $3 AND la.end_date >= $2)
       LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
       WHERE (e.reporting_manager_id = $1 OR $1 = 0 OR e.id = $1)
         AND e.is_deleted = false AND e.status = 'ACTIVE'
       ORDER BY d.name, e.first_name`,
      [managerId, startDate, endDate]
    );
    return res.rows;
  }

  // ─── Submit Leave Request with Workflow & Conflict Recording ─────────────
  async submitWorkflowRequest(dto: SubmitLeaveWorkflowDTO) {
    const conflicts = await this.detectConflicts(dto.employee_id, dto.start_date, dto.end_date);
    const criticalConflict = conflicts.find(c => c.severity === 'CRITICAL');
    if (criticalConflict) {
      throw new Error(criticalConflict.description);
    }

    // Check balance guard
    const balRes = await dbService.query(
      `SELECT remaining_days FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2`,
      [dto.employee_id, dto.leave_type_id]
    );
    const remaining = parseFloat(balRes.rows[0]?.remaining_days || '0');
    if (remaining < dto.total_days) {
      throw new Error(`Insufficient leave balance. Requested: ${dto.total_days} days, Available: ${remaining} days.`);
    }

    // Fetch employee reporting manager
    const empRes = await dbService.query(`SELECT reporting_manager_id FROM employees WHERE id = $1`, [dto.employee_id]);
    const managerId = empRes.rows[0]?.reporting_manager_id || null;

    const res = await dbService.query(
      `INSERT INTO leave_applications (
        employee_id, leave_type_id, start_date, end_date, total_days,
        is_half_day, half_day_session, is_hourly, hours_requested,
        reason, emergency_contact, contact_during_leave, work_handover,
        replacement_employee_id, attachment_url, status, manager_id,
        created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'MANAGER_PENDING',$16,$1,$1)
      RETURNING *`,
      [
        dto.employee_id, dto.leave_type_id, dto.start_date, dto.end_date, dto.total_days,
        dto.is_half_day || false, dto.half_day_session || null,
        dto.is_hourly || false, dto.hours_requested || null,
        dto.reason, dto.emergency_contact || null, dto.contact_during_leave || null,
        dto.work_handover || null, dto.replacement_employee_id || null,
        dto.attachment_url || null, managerId,
      ]
    );

    const leave = res.rows[0];

    // Record non-critical warnings as conflict logs
    for (const c of conflicts) {
      await dbService.query(
        `INSERT INTO leave_conflicts (leave_id, conflict_type, conflict_description, severity)
         VALUES ($1, $2, $3, $4)`,
        [leave.id, c.type, c.description, c.severity]
      );
    }

    await this._logAudit(dto.employee_id, 'LEAVE_SUBMITTED', `Leave request #${leave.id} submitted for ${dto.start_date} to ${dto.end_date} (${dto.total_days} days)`);
    return { ...leave, conflicts };
  }

  // ─── Process Approval (Multi-level + Auto Attendance & Balance Sync) ──────
  async processApproval(id: number, action: 'APPROVED' | 'REJECTED' | 'REQUEST_INFO', approverId: number, approverRole: string, comment: string) {
    return await dbService.transaction(async (client) => {
      const leaveRes = await client.query(
        `SELECT la.*, lt.code as leave_type_code, lt.name as leave_type_name
         FROM leave_applications la
         JOIN leave_types lt ON la.leave_type_id = lt.id
         WHERE la.id = $1 AND la.deleted_at IS NULL FOR UPDATE`,
        [id]
      );
      const leave = leaveRes.rows[0];
      if (!leave) throw new Error('Leave application not found');

      const isHR = approverRole === 'HR_MANAGER' || approverRole === 'SUPER_ADMIN' || approverRole === 'ADMIN';
      let nextStatus = leave.status;

      if (action === 'REJECTED') {
        nextStatus = 'REJECTED';
      } else if (action === 'APPROVED') {
        if (!isHR && leave.status === 'MANAGER_PENDING') {
          // If 2-level approval required, move to HR_PENDING, else APPROVED
          nextStatus = 'APPROVED';
        } else {
          nextStatus = 'APPROVED';
        }
      } else if (action === 'REQUEST_INFO') {
        nextStatus = 'MANAGER_PENDING';
      }

      // Update Leave Record
      const updateRes = await client.query(
        `UPDATE leave_applications
         SET status = $1,
             manager_action = CASE WHEN NOT $2 THEN $3 ELSE manager_action END,
             manager_comment = CASE WHEN NOT $2 THEN $4 ELSE manager_comment END,
             manager_actioned_at = CASE WHEN NOT $2 THEN CURRENT_TIMESTAMP ELSE manager_actioned_at END,
             hr_action = CASE WHEN $2 THEN $3 ELSE hr_action END,
             hr_comment = CASE WHEN $2 THEN $4 ELSE hr_comment END,
             hr_actioned_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE hr_actioned_at END,
             approver_id = $5, rejection_reason = CASE WHEN $3 = 'REJECTED' THEN $4 ELSE rejection_reason END,
             updated_at = CURRENT_TIMESTAMP, updated_by = $5
         WHERE id = $6 RETURNING *`,
        [nextStatus, isHR, action, comment || null, approverId, id]
      );
      const updatedLeave = updateRes.rows[0];

      // Record Approval History
      await client.query(
        `INSERT INTO leave_approvals (leave_id, approver_id, level, action, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, approverId, isHR ? 'HR' : 'MANAGER', action, comment || null]
      );

      // On Full Approval: Deduct Balance & Sync Attendance Automatically
      if (nextStatus === 'APPROVED' && leave.status !== 'APPROVED') {
        await client.query(
          `UPDATE leave_balances
           SET used_days = used_days + $1, remaining_days = remaining_days - $1, updated_at = CURRENT_TIMESTAMP
           WHERE employee_id = $2 AND leave_type_id = $3`,
          [leave.total_days, leave.employee_id, leave.leave_type_id]
        );

        // Auto Attendance Sync for leave days
        await client.query(
          `INSERT INTO attendance (employee_id, date, status, work_hours)
           SELECT $1, d::date, 'ON_LEAVE', 0.0
           FROM generate_series($2::date, $3::date, '1 day'::interval) d
           ON CONFLICT (employee_id, date) DO UPDATE
           SET status = 'ON_LEAVE', work_hours = 0.0`,
          [leave.employee_id, leave.start_date, leave.end_date]
        );

        await client.query(
          `UPDATE leave_applications SET attendance_synced = true WHERE id = $1`,
          [id]
        );

        await client.query(
          `INSERT INTO audit_logs (employee_id, action, module, details)
           VALUES ($1, 'LEAVE_APPROVED_ATTENDANCE_SYNCED', 'LEAVE_WORKFLOW', $2)`,
          [leave.employee_id, `Leave #${id} approved by approver #${approverId}. Balance deducted -${leave.total_days} days. Attendance synced.`]
        );
      }

      return updatedLeave;
    });
  }

  // ─── Super Admin Override ────────────────────────────────────────────────
  async superAdminOverride(id: number, action: 'FORCE_APPROVE' | 'FORCE_REJECT' | 'CANCEL', adminId: number, reason: string) {
    const toStatus = action === 'FORCE_APPROVE' ? 'APPROVED' : action === 'FORCE_REJECT' ? 'REJECTED' : 'CANCELLED';

    const res = await dbService.query(
      `UPDATE leave_applications
       SET status = $1, approver_id = $2, rejection_reason = $3,
           updated_at = CURRENT_TIMESTAMP, updated_by = $2
       WHERE id = $4 AND deleted_at IS NULL RETURNING *`,
      [toStatus, adminId, reason, id]
    );

    await this._logAudit(adminId, `LEAVE_ADMIN_${action}`, `Super Admin override on leave #${id}: ${reason}`);
    return res.rows[0];
  }

  // ─── Bulk Approve ─────────────────────────────────────────────────────────
  async bulkApprove(ids: number[], approverId: number, approverRole: string, comment: string) {
    const results = [];
    for (const id of ids) {
      try {
        const res = await this.processApproval(id, 'APPROVED', approverId, approverRole, comment || 'Bulk approved');
        results.push({ id, success: true, data: res });
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }
    return results;
  }

  // ─── Leave Calendar Events (Holidays + Approved Leaves + Birthdays) ──────
  async getLeaveCalendarEvents(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const [leavesRes, holRes, bdayRes] = await Promise.all([
      dbService.query(
        `SELECT la.id, la.start_date, la.end_date, la.status, la.total_days,
          lt.name as leave_type_name, lt.color,
          e.first_name, e.last_name, e.employee_code, d.name as department_name
         FROM leave_applications la
         JOIN leave_types lt ON la.leave_type_id = lt.id
         JOIN employees e ON la.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE la.status IN ('APPROVED', 'MANAGER_PENDING') AND la.deleted_at IS NULL
           AND (la.start_date <= $2 AND la.end_date >= $1)
         ORDER BY la.start_date ASC`,
        [startDate, endDate]
      ),
      dbService.query(
        `SELECT id, name, date, type FROM holidays WHERE date >= $1 AND date <= $2 AND is_active = true`,
        [startDate, endDate]
      ),
      dbService.query(
        `SELECT id, first_name, last_name, date_of_birth FROM employees
         WHERE is_deleted = false AND date_of_birth IS NOT NULL
           AND EXTRACT(MONTH FROM date_of_birth) = $1`,
        [month]
      ),
    ]);

    return {
      leaves: leavesRes.rows,
      holidays: holRes.rows,
      birthdays: bdayRes.rows,
    };
  }

  private async _logAudit(actorId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details) VALUES ($1, $2, 'LEAVE_WORKFLOW', $3)`,
        [actorId, action, details]
      );
    } catch { /* non-fatal */ }
  }
}

export const leaveWorkflowRepository = new LeaveWorkflowRepository();
