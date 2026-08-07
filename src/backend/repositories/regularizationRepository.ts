import dbService from '../database/db.js';

export type RequestType =
  | 'MISSED_PUNCH_IN' | 'MISSED_PUNCH_OUT' | 'LATE_ARRIVAL' | 'EARLY_DEPARTURE'
  | 'WRONG_STATUS' | 'FORGOT_BREAK' | 'FORGOT_BREAK_END' | 'WFH_CORRECTION'
  | 'BUSINESS_VISIT' | 'TRAINING' | 'SYSTEM_ERROR' | 'GPS_FAILURE'
  | 'MANUAL_ENTRY' | 'CUSTOM';

export type RegStatus =
  | 'DRAFT' | 'PENDING_MANAGER' | 'PENDING_HR' | 'PENDING_ADMIN'
  | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'INFO_REQUESTED';

export interface CreateRegDTO {
  employee_id: number;
  attendance_date: string;
  request_type: RequestType;
  requested_punch_in?: string;
  requested_punch_out?: string;
  requested_break_start?: string;
  requested_break_end?: string;
  reason: string;
  supporting_notes?: string;
  attachment_url?: string;
  manager_id?: number;
}

export class RegularizationRepository {
  // ─── Submit ──────────────────────────────────────────────────────────────
  async create(dto: CreateRegDTO) {
    // Duplicate check: same employee + same date + active request
    const dup = await dbService.query(
      `SELECT id FROM attendance_regularizations
       WHERE employee_id = $1 AND attendance_date = $2
         AND status NOT IN ('APPROVED','REJECTED','CANCELLED','EXPIRED')
         AND deleted_at IS NULL`,
      [dto.employee_id, dto.attendance_date]
    );
    if (dup.rows.length) {
      throw new Error('An active regularization request already exists for this date. Please cancel or withdraw it first.');
    }

    // Future date guard
    const reqDate = new Date(dto.attendance_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (reqDate > today) {
      throw new Error('Attendance correction cannot be submitted for a future date.');
    }

    const res = await dbService.query(
      `INSERT INTO attendance_regularizations (
        employee_id, attendance_date, request_type,
        requested_punch_in, requested_punch_out,
        requested_break_start, requested_break_end,
        reason, supporting_notes, attachment_url,
        manager_id, status, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING_MANAGER',$1,$1)
      RETURNING *`,
      [
        dto.employee_id, dto.attendance_date, dto.request_type,
        dto.requested_punch_in || null, dto.requested_punch_out || null,
        dto.requested_break_start || null, dto.requested_break_end || null,
        dto.reason, dto.supporting_notes || null, dto.attachment_url || null,
        dto.manager_id || null,
      ]
    );

    const reg = res.rows[0];
    await this._addAudit(reg.id, dto.employee_id, 'CREATED', null, 'PENDING_MANAGER', 'Request submitted by employee');
    await this._logGlobal(dto.employee_id, 'REG_SUBMITTED', `Regularization submitted for ${dto.attendance_date} [${dto.request_type}]`);
    return reg;
  }

  // ─── List / Query ─────────────────────────────────────────────────────────
  async getAll(filters: {
    employee_id?: number;
    status?: string;
    manager_id?: number;
    startDate?: string;
    endDate?: string;
    isManager?: boolean;
    isHR?: boolean;
  }) {
    const conditions: string[] = ['ar.deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (filters.employee_id && !filters.isManager && !filters.isHR) {
      conditions.push(`ar.employee_id = $${idx++}`); params.push(filters.employee_id);
    }
    if (filters.manager_id && filters.isManager && !filters.isHR) {
      conditions.push(`(ar.manager_id = $${idx} OR e.reporting_manager_id = $${idx})`);
      params.push(filters.manager_id); idx++;
    }
    if (filters.status) { conditions.push(`ar.status = $${idx++}`); params.push(filters.status); }
    if (filters.startDate) { conditions.push(`ar.attendance_date >= $${idx++}`); params.push(filters.startDate); }
    if (filters.endDate) { conditions.push(`ar.attendance_date <= $${idx++}`); params.push(filters.endDate); }

    const sql = `
      SELECT ar.*,
        e.first_name, e.last_name, e.employee_code, e.designation, e.avatar_url,
        d.name as department_name, b.name as branch_name,
        mgr.first_name as manager_first, mgr.last_name as manager_last,
        CASE WHEN a.id IS NOT NULL THEN json_build_object(
          'punch_in', a.punch_in, 'punch_out', a.punch_out,
          'work_hours', a.work_hours, 'status', a.status, 'is_late', a.is_late
        ) ELSE NULL END as existing_attendance
      FROM attendance_regularizations ar
      JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN employees mgr ON ar.manager_id = mgr.id
      LEFT JOIN attendance a ON a.employee_id = ar.employee_id AND a.date = ar.attendance_date
      WHERE ${conditions.join(' AND ')}
      ORDER BY ar.created_at DESC
    `;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async getById(id: number) {
    const res = await dbService.query(
      `SELECT ar.*,
        e.first_name, e.last_name, e.employee_code, e.designation, e.avatar_url, e.email,
        d.name as department_name, b.name as branch_name,
        mgr.first_name as manager_first, mgr.last_name as manager_last
       FROM attendance_regularizations ar
       JOIN employees e ON ar.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN employees mgr ON ar.manager_id = mgr.id
       WHERE ar.id = $1 AND ar.deleted_at IS NULL`,
      [id]
    );
    if (!res.rows[0]) return null;

    // Fetch comments & audit
    const [commentsRes, auditRes] = await Promise.all([
      dbService.query(
        `SELECT rc.*, e.first_name, e.last_name, e.role
         FROM regularization_comments rc
         JOIN employees e ON rc.commenter_id = e.id
         WHERE rc.regularization_id = $1
         ORDER BY rc.created_at ASC`, [id]
      ),
      dbService.query(
        `SELECT ra.*, e.first_name, e.last_name, e.role
         FROM regularization_audit ra
         JOIN employees e ON ra.actor_id = e.id
         WHERE ra.regularization_id = $1
         ORDER BY ra.created_at ASC`, [id]
      ),
    ]);

    return { ...res.rows[0], comments: commentsRes.rows, audit_trail: auditRes.rows };
  }

  // ─── Pending Approvals (for manager/HR/admin queues) ──────────────────────
  async getPendingApprovals(actorId: number, actorRole: string) {
    let statusFilter = 'PENDING_MANAGER';
    let managerId: number | undefined;

    if (actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN') {
      statusFilter = 'PENDING_ADMIN';
    } else if (actorRole === 'HR_MANAGER') {
      statusFilter = 'PENDING_HR';
    } else {
      managerId = actorId;
    }

    const conditions: string[] = [`ar.status = '${statusFilter}'`, 'ar.deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (managerId) {
      conditions.push(`(ar.manager_id = $${idx} OR e.reporting_manager_id = $${idx})`);
      params.push(managerId); idx++;
    }

    const res = await dbService.query(
      `SELECT ar.*,
        e.first_name, e.last_name, e.employee_code, e.designation,
        d.name as department_name,
        CASE WHEN a.id IS NOT NULL THEN json_build_object(
          'punch_in', a.punch_in, 'punch_out', a.punch_out, 'status', a.status
        ) ELSE NULL END as existing_attendance
       FROM attendance_regularizations ar
       JOIN employees e ON ar.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN attendance a ON a.employee_id = ar.employee_id AND a.date = ar.attendance_date
       WHERE ${conditions.join(' AND ')}
       ORDER BY ar.created_at ASC`,
      params
    );
    return res.rows;
  }

  // ─── Manager Action ───────────────────────────────────────────────────────
  async managerAction(id: number, action: 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | 'FORWARD_HR', managerId: number, comment: string) {
    const reg = await this._load(id);
    if (!reg) throw new Error('Regularization request not found');

    const fromStatus = reg.status;
    let toStatus: string = action === 'APPROVED' ? 'APPROVED'
      : action === 'REJECTED' ? 'REJECTED'
      : action === 'INFO_REQUESTED' ? 'INFO_REQUESTED'
      : 'PENDING_HR';

    await dbService.query(
      `UPDATE attendance_regularizations
       SET manager_action = $1, manager_comment = $2, manager_id = $3,
           manager_actioned_at = CURRENT_TIMESTAMP, status = $4,
           updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE id = $5`,
      [action, comment, managerId, toStatus, id]
    );

    // Add comment to thread
    if (comment) await this.addComment(id, managerId, comment, false);
    await this._addAudit(id, managerId, `MANAGER_${action}`, fromStatus, toStatus, comment);
    await this._logGlobal(managerId, `REG_MANAGER_${action}`, `Manager ${action} regularization #${id}`);

    if (toStatus === 'APPROVED') {
      await this._applyAttendanceCorrection(id);
    }

    return await this.getById(id);
  }

  // ─── HR Action ────────────────────────────────────────────────────────────
  async hrAction(id: number, action: 'APPROVED' | 'REJECTED' | 'ESCALATE', hrId: number, comment: string) {
    const reg = await this._load(id);
    if (!reg) throw new Error('Request not found');

    const fromStatus = reg.status;
    const toStatus = action === 'APPROVED' ? 'APPROVED'
      : action === 'REJECTED' ? 'REJECTED'
      : 'PENDING_ADMIN';

    await dbService.query(
      `UPDATE attendance_regularizations
       SET hr_action = $1, hr_comment = $2, hr_id = $3,
           hr_actioned_at = CURRENT_TIMESTAMP, status = $4,
           updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE id = $5`,
      [action, comment, hrId, toStatus, id]
    );

    if (comment) await this.addComment(id, hrId, comment, false);
    await this._addAudit(id, hrId, `HR_${action}`, fromStatus, toStatus, comment);
    await this._logGlobal(hrId, `REG_HR_${action}`, `HR ${action} regularization #${id}`);

    if (toStatus === 'APPROVED') await this._applyAttendanceCorrection(id);
    return await this.getById(id);
  }

  // ─── Admin / Super Admin Action ───────────────────────────────────────────
  async adminAction(id: number, action: 'APPROVED' | 'REJECTED' | 'FORCE_APPROVE' | 'FORCE_REJECT', adminId: number, comment: string) {
    const reg = await this._load(id);
    if (!reg) throw new Error('Request not found');

    const fromStatus = reg.status;
    const toStatus = (action === 'APPROVED' || action === 'FORCE_APPROVE') ? 'APPROVED' : 'REJECTED';

    await dbService.query(
      `UPDATE attendance_regularizations
       SET admin_action = $1, admin_comment = $2, admin_id = $3,
           admin_actioned_at = CURRENT_TIMESTAMP,
           approved_by = $3, approved_at = CURRENT_TIMESTAMP,
           status = $4, updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE id = $5`,
      [action, comment, adminId, toStatus, id]
    );

    if (comment) await this.addComment(id, adminId, comment, true);
    await this._addAudit(id, adminId, `ADMIN_${action}`, fromStatus, toStatus, comment);
    await this._logGlobal(adminId, `REG_ADMIN_${action}`, `Admin ${action} regularization #${id}`);

    if (toStatus === 'APPROVED') await this._applyAttendanceCorrection(id);
    return await this.getById(id);
  }

  // ─── Cancel (by employee) ─────────────────────────────────────────────────
  async cancel(id: number, employeeId: number) {
    const reg = await this._load(id);
    if (!reg) throw new Error('Not found');
    if (reg.employee_id !== employeeId) throw new Error('You can only cancel your own requests');
    if (!['PENDING_MANAGER', 'INFO_REQUESTED', 'DRAFT'].includes(reg.status)) {
      throw new Error('Request cannot be cancelled at current stage');
    }

    await dbService.query(
      `UPDATE attendance_regularizations
       SET status = 'CANCELLED', deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP, updated_by = $1
       WHERE id = $2`,
      [employeeId, id]
    );
    await this._addAudit(id, employeeId, 'CANCELLED', reg.status, 'CANCELLED', 'Cancelled by employee');
    return { success: true };
  }

  // ─── Bulk Approve ─────────────────────────────────────────────────────────
  async bulkApprove(ids: number[], actorId: number, actorRole: string) {
    const results = [];
    for (const id of ids) {
      try {
        let result;
        if (actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN') {
          result = await this.adminAction(id, 'APPROVED', actorId, 'Bulk approved');
        } else if (actorRole === 'HR_MANAGER') {
          result = await this.hrAction(id, 'APPROVED', actorId, 'Bulk approved');
        } else {
          result = await this.managerAction(id, 'APPROVED', actorId, 'Bulk approved');
        }
        results.push({ id, success: true, data: result });
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }
    return results;
  }

  // ─── Comments ─────────────────────────────────────────────────────────────
  async addComment(regId: number, commenterId: number, comment: string, isInternal: boolean) {
    const res = await dbService.query(
      `INSERT INTO regularization_comments (regularization_id, commenter_id, comment, is_internal)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [regId, commenterId, comment, isInternal]
    );
    return res.rows[0];
  }

  // ─── Reports ──────────────────────────────────────────────────────────────
  async getRegularizationStats(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
        COUNT(CASE WHEN status LIKE 'PENDING%' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
        ROUND(AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600)::numeric, 2) as avg_approval_hours,
        COUNT(CASE WHEN request_type = 'MISSED_PUNCH_IN' THEN 1 END) as missed_punch_in,
        COUNT(CASE WHEN request_type = 'MISSED_PUNCH_OUT' THEN 1 END) as missed_punch_out,
        COUNT(CASE WHEN request_type = 'LATE_ARRIVAL' THEN 1 END) as late_arrival,
        COUNT(CASE WHEN request_type = 'EARLY_DEPARTURE' THEN 1 END) as early_departure,
        COUNT(CASE WHEN request_type = 'WFH_CORRECTION' THEN 1 END) as wfh_correction
       FROM attendance_regularizations
       WHERE created_at >= $1 AND created_at <= $2 AND deleted_at IS NULL`,
      [startDate, endDate]
    );
    return res.rows[0];
  }

  async getDepartmentStats(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT d.name as department_name,
        COUNT(ar.id) as total_requests,
        COUNT(CASE WHEN ar.status = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN ar.status = 'REJECTED' THEN 1 END) as rejected,
        COUNT(CASE WHEN ar.status LIKE 'PENDING%' THEN 1 END) as pending
       FROM attendance_regularizations ar
       JOIN employees e ON ar.employee_id = e.id
       JOIN departments d ON e.department_id = d.id
       WHERE ar.created_at >= $1 AND ar.created_at <= $2 AND ar.deleted_at IS NULL
       GROUP BY d.name ORDER BY total_requests DESC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  async getManagerStats(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT mgr.first_name, mgr.last_name, mgr.employee_code,
        COUNT(ar.id) as total_assigned,
        COUNT(CASE WHEN ar.status = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN ar.status = 'REJECTED' THEN 1 END) as rejected,
        COUNT(CASE WHEN ar.status LIKE 'PENDING%' THEN 1 END) as pending,
        ROUND(AVG(EXTRACT(EPOCH FROM (ar.manager_actioned_at - ar.created_at))/3600)::numeric, 2) as avg_response_hours
       FROM attendance_regularizations ar
       JOIN employees mgr ON ar.manager_id = mgr.id
       WHERE ar.created_at >= $1 AND ar.created_at <= $2 AND ar.deleted_at IS NULL
       GROUP BY mgr.id, mgr.first_name, mgr.last_name, mgr.employee_code
       ORDER BY total_assigned DESC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────
  private async _load(id: number) {
    const res = await dbService.query(
      `SELECT * FROM attendance_regularizations WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  private async _addAudit(regId: number, actorId: number, action: string, fromStatus: string | null, toStatus: string, notes: string) {
    try {
      await dbService.query(
        `INSERT INTO regularization_audit (regularization_id, actor_id, action, from_status, to_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [regId, actorId, action, fromStatus, toStatus, notes]
      );
    } catch { /* non-fatal */ }
  }

  private async _logGlobal(employeeId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details) VALUES ($1, $2, 'REGULARIZATION', $3)`,
        [employeeId, action, details]
      );
    } catch { /* non-fatal */ }
  }

  private async _applyAttendanceCorrection(regId: number) {
    const reg = await this._load(regId);
    if (!reg) return;

    await dbService.transaction(async (client) => {
      // Calculate work hours
      let workHours = 0;
      if (reg.requested_punch_in && reg.requested_punch_out) {
        const diff = new Date(reg.requested_punch_out).getTime() - new Date(reg.requested_punch_in).getTime();
        workHours = Math.round((diff / 3600000) * 100) / 100;
        // Subtract break if provided
        if (reg.requested_break_start && reg.requested_break_end) {
          const breakDiff = new Date(reg.requested_break_end).getTime() - new Date(reg.requested_break_start).getTime();
          workHours -= Math.round((breakDiff / 3600000) * 100) / 100;
        }
        workHours = Math.max(0, workHours);
      }

      const attStatus = workHours >= 8 ? 'PRESENT'
        : workHours >= 4 ? 'HALF_DAY'
        : workHours > 0 ? 'PRESENT' : 'PRESENT';

      const isOT = workHours > 9;

      // Upsert attendance record
      await client.query(
        `INSERT INTO attendance (employee_id, date, punch_in, punch_out, work_hours, status, is_overtime)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (employee_id, date) DO UPDATE
         SET punch_in = COALESCE($3, attendance.punch_in),
             punch_out = COALESCE($4, attendance.punch_out),
             work_hours = CASE WHEN $5 > 0 THEN $5 ELSE attendance.work_hours END,
             status = $6,
             is_overtime = $7`,
        [reg.employee_id, reg.attendance_date, reg.requested_punch_in, reg.requested_punch_out,
         workHours, attStatus, isOT]
      );

      // Mark correction applied
      await client.query(
        `UPDATE attendance_regularizations
         SET attendance_updated = true, approved_at = CURRENT_TIMESTAMP,
             approved_by = COALESCE(admin_id, hr_id, manager_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [regId]
      );

      // Audit
      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'ATTENDANCE_CORRECTED', 'REGULARIZATION', $2)`,
        [reg.employee_id, `Attendance for ${reg.attendance_date} corrected via regularization #${regId}. WorkHours: ${workHours}`]
      );
    });
  }
}

export const regularizationRepository = new RegularizationRepository();
