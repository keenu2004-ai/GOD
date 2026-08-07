import dbService from '../database/db.js';

export interface ShiftDTO {
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_mins: number;
  late_threshold_mins: number;
  half_day_threshold_hours: number;
  early_exit_threshold_mins: number;
  break_duration_mins: number;
  max_work_hours: number;
  min_work_hours: number;
  overtime_eligible: boolean;
  is_night_shift: boolean;
  is_wfh: boolean;
  auto_clockout_after_hours: number;
  shift_type: string;
  color: string;
}

export class ShiftRepository {
  // ---------- Shifts CRUD ----------
  async createShift(dto: ShiftDTO, createdBy: number) {
    const res = await dbService.query(
      `INSERT INTO shifts (
        name, code, start_time, end_time, grace_mins, late_threshold_mins,
        half_day_threshold_hours, early_exit_threshold_mins, break_duration_mins,
        max_work_hours, min_work_hours, overtime_eligible, is_night_shift, is_wfh,
        auto_clockout_after_hours, shift_type, color, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        grace_mins = EXCLUDED.grace_mins,
        updated_by = EXCLUDED.created_by
      RETURNING *`,
      [
        dto.name, dto.code, dto.start_time, dto.end_time, dto.grace_mins,
        dto.late_threshold_mins, dto.half_day_threshold_hours, dto.early_exit_threshold_mins,
        dto.break_duration_mins, dto.max_work_hours, dto.min_work_hours,
        dto.overtime_eligible, dto.is_night_shift, dto.is_wfh,
        dto.auto_clockout_after_hours, dto.shift_type, dto.color, createdBy,
      ]
    );
    return res.rows[0];
  }

  async getAllShifts() {
    const res = await dbService.query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM employee_shift_assignments esa WHERE esa.shift_id = s.id AND esa.is_active = true) as assigned_count
       FROM shifts s
       WHERE s.is_deleted = false
       ORDER BY s.shift_type, s.name`
    );
    return res.rows;
  }

  async getShiftById(id: number) {
    const res = await dbService.query(`SELECT * FROM shifts WHERE id = $1 AND is_deleted = false`, [id]);
    return res.rows[0] || null;
  }

  async updateShift(id: number, dto: Partial<ShiftDTO>, updatedBy: number) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const updatable = [
      'name','start_time','end_time','grace_mins','late_threshold_mins',
      'half_day_threshold_hours','early_exit_threshold_mins','break_duration_mins',
      'max_work_hours','min_work_hours','overtime_eligible','is_night_shift',
      'is_wfh','auto_clockout_after_hours','shift_type','color',
    ];

    updatable.forEach(key => {
      if ((dto as any)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push((dto as any)[key]);
      }
    });

    if (!fields.length) return this.getShiftById(id);

    fields.push(`updated_by = $${idx++}`, `updated_at = CURRENT_TIMESTAMP`);
    params.push(updatedBy, id);

    const res = await dbService.query(
      `UPDATE shifts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    return res.rows[0] || null;
  }

  async softDeleteShift(id: number) {
    await dbService.query(`UPDATE shifts SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    return true;
  }

  // ---------- Shift Assignments ----------
  async assignShift(data: {
    employee_id: number;
    shift_id: number;
    effective_date: string;
    expiry_date?: string;
    assigned_by: number;
  }) {
    // Deactivate existing active assignment for employee
    await dbService.query(
      `UPDATE employee_shift_assignments SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $1 AND is_active = true`,
      [data.employee_id]
    );

    const res = await dbService.query(
      `INSERT INTO employee_shift_assignments (employee_id, shift_id, effective_date, expiry_date, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, true, $5, $5)
       RETURNING *`,
      [data.employee_id, data.shift_id, data.effective_date, data.expiry_date || null, data.assigned_by]
    );

    // Audit log
    await this.recordAudit(data.assigned_by, data.employee_id, 'SHIFT_ASSIGNED',
      `Assigned shift_id=${data.shift_id} from ${data.effective_date}`);

    return res.rows[0];
  }

  async bulkAssignShift(employeeIds: number[], shiftId: number, effectiveDate: string, assignedBy: number) {
    const results = [];
    for (const empId of employeeIds) {
      try {
        const r = await this.assignShift({ employee_id: empId, shift_id: shiftId, effective_date: effectiveDate, assigned_by: assignedBy });
        results.push({ employee_id: empId, success: true, data: r });
      } catch (e: any) {
        results.push({ employee_id: empId, success: false, error: e.message });
      }
    }
    return results;
  }

  async getEmployeeCurrentShift(employeeId: number) {
    const res = await dbService.query(
      `SELECT esa.*, s.name as shift_name, s.code as shift_code, s.start_time, s.end_time,
              s.grace_mins, s.late_threshold_mins, s.is_night_shift, s.is_wfh, s.color, s.shift_type
       FROM employee_shift_assignments esa
       JOIN shifts s ON esa.shift_id = s.id
       WHERE esa.employee_id = $1 AND esa.is_active = true
       ORDER BY esa.effective_date DESC LIMIT 1`,
      [employeeId]
    );
    return res.rows[0] || null;
  }

  async getAllAssignments(filters: { department_id?: number; branch_id?: number; shift_id?: number }) {
    const conditions: string[] = ['esa.is_active = true'];
    const params: any[] = [];
    let idx = 1;

    if (filters.shift_id) { conditions.push(`esa.shift_id = $${idx++}`); params.push(filters.shift_id); }
    if (filters.department_id) { conditions.push(`e.department_id = $${idx++}`); params.push(filters.department_id); }
    if (filters.branch_id) { conditions.push(`e.branch_id = $${idx++}`); params.push(filters.branch_id); }

    const res = await dbService.query(
      `SELECT esa.*, e.first_name, e.last_name, e.employee_code, e.designation,
              d.name as department_name, b.name as branch_name,
              s.name as shift_name, s.code as shift_code, s.start_time, s.end_time, s.color
       FROM employee_shift_assignments esa
       JOIN employees e ON esa.employee_id = e.id
       JOIN shifts s ON esa.shift_id = s.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.first_name`,
      params
    );
    return res.rows;
  }

  // ---------- Shift History ----------
  async getShiftHistory(employeeId: number) {
    const res = await dbService.query(
      `SELECT esa.*, s.name as shift_name, s.code as shift_code, s.start_time, s.end_time, s.color
       FROM employee_shift_assignments esa
       JOIN shifts s ON esa.shift_id = s.id
       WHERE esa.employee_id = $1
       ORDER BY esa.effective_date DESC`,
      [employeeId]
    );
    return res.rows;
  }

  // ---------- Shift Swap Requests ----------
  async createSwapRequest(data: {
    requester_id: number;
    target_employee_id: number;
    requester_shift_id: number;
    target_shift_id: number;
    shift_date: string;
    reason: string;
  }) {
    const res = await dbService.query(
      `INSERT INTO shift_swap_requests (
        requester_id, target_employee_id, requester_shift_id, target_shift_id,
        shift_date, reason, status, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$1,$1) RETURNING *`,
      [data.requester_id, data.target_employee_id, data.requester_shift_id,
       data.target_shift_id, data.shift_date, data.reason]
    );
    return res.rows[0];
  }

  async getSwapRequests(employeeId?: number, isManager = false) {
    let sql = `
      SELECT ssr.*,
        e1.first_name as requester_first, e1.last_name as requester_last, e1.employee_code as requester_code,
        e2.first_name as target_first, e2.last_name as target_last, e2.employee_code as target_code,
        s1.name as requester_shift_name, s2.name as target_shift_name
      FROM shift_swap_requests ssr
      JOIN employees e1 ON ssr.requester_id = e1.id
      JOIN employees e2 ON ssr.target_employee_id = e2.id
      LEFT JOIN shifts s1 ON ssr.requester_shift_id = s1.id
      LEFT JOIN shifts s2 ON ssr.target_shift_id = s2.id
    `;
    const params: any[] = [];

    if (employeeId && !isManager) {
      sql += ` WHERE ssr.requester_id = $1 OR ssr.target_employee_id = $1`;
      params.push(employeeId);
    }

    sql += ` ORDER BY ssr.created_at DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async approveSwapRequest(id: number, status: string, approverId: number) {
    const res = await dbService.query(
      `UPDATE shift_swap_requests SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP, updated_by = $2
       WHERE id = $3 RETURNING *`,
      [status, approverId, id]
    );
    return res.rows[0];
  }

  // ---------- Overtime Requests ----------
  async createOvertimeRequest(data: {
    employee_id: number;
    date: string;
    expected_overtime_hours: number;
    reason: string;
  }) {
    const res = await dbService.query(
      `INSERT INTO overtime_requests (employee_id, date, expected_overtime_hours, reason, status, created_by, updated_by)
       VALUES ($1,$2,$3,$4,'PENDING',$1,$1) RETURNING *`,
      [data.employee_id, data.date, data.expected_overtime_hours, data.reason]
    );
    return res.rows[0];
  }

  async getOvertimeRequests(employeeId?: number, isManager = false) {
    let sql = `
      SELECT ovr.*, e.first_name, e.last_name, e.employee_code, e.designation,
             d.name as department_name, s.name as shift_name
      FROM overtime_requests ovr
      JOIN employees e ON ovr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_shift_assignments esa ON esa.employee_id = e.id AND esa.is_active = true
      LEFT JOIN shifts s ON esa.shift_id = s.id
    `;
    const params: any[] = [];

    if (employeeId && !isManager) {
      sql += ` WHERE ovr.employee_id = $1`;
      params.push(employeeId);
    }

    sql += ` ORDER BY ovr.created_at DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async approveOvertimeRequest(id: number, status: string, approvedHours: number, approverId: number) {
    const res = await dbService.query(
      `UPDATE overtime_requests
       SET status = $1, approved_hours = $2, approved_by = $3,
           approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE id = $4 RETURNING *`,
      [status, approvedHours, approverId, id]
    );
    return res.rows[0];
  }

  // ---------- Analytics ----------
  async getShiftUtilizationReport(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT s.name as shift_name, s.code,
              COUNT(a.id) as total_sessions,
              COUNT(CASE WHEN a.is_late THEN 1 END) as late_count,
              COUNT(CASE WHEN a.is_overtime THEN 1 END) as overtime_count,
              ROUND(AVG(a.work_hours)::numeric, 2) as avg_work_hours,
              ROUND(AVG(a.break_duration_mins)::numeric, 0) as avg_break_mins
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN employee_shift_assignments esa ON esa.employee_id = e.id AND esa.is_active = true
       LEFT JOIN shifts s ON esa.shift_id = s.id
       WHERE a.date >= $1 AND a.date <= $2
       GROUP BY s.name, s.code
       ORDER BY total_sessions DESC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  async getOvertimeSummary(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT e.first_name, e.last_name, e.employee_code, d.name as department_name,
              COUNT(a.id) as overtime_days,
              ROUND(SUM(a.work_hours - 9)::numeric, 2) as total_overtime_hours
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.is_overtime = true AND a.date >= $1 AND a.date <= $2
       GROUP BY e.id, e.first_name, e.last_name, e.employee_code, d.name
       ORDER BY total_overtime_hours DESC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ---------- Audit ----------
  async recordAudit(actorId: number, subjectId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details) VALUES ($1, $2, 'SHIFT', $3)`,
        [actorId, action, `EmployeeID:${subjectId} - ${details}`]
      );
    } catch (e) {
      console.log(`[ShiftAudit] ${action}: ${details}`);
    }
  }
}

export const shiftRepository = new ShiftRepository();
