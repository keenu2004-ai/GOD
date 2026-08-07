import dbService from '../database/db.js';

export interface LeavePolicyDTO {
  name: string;
  code: string;
  description?: string;
  leave_type_id: number;
  annual_allocation: number;
  monthly_accrual?: number;
  max_balance?: number;
  carry_forward_limit?: number;
  encashment_limit?: number;
  half_day_allowed?: boolean;
  hourly_leave_allowed?: boolean;
  negative_balance_allowed?: boolean;
  probation_applicable?: boolean;
  min_notice_days?: number;
  max_consecutive_days?: number;
  attachment_required?: boolean;
  branch_id?: number;
  department_id?: number;
  is_active?: boolean;
}

export interface PolicyAssignDTO {
  policy_id: number;
  employee_id?: number;
  department_id?: number;
  branch_id?: number;
  role?: string;
  employment_type?: string;
  effective_date?: string;
  expiry_date?: string;
}

export class LeavePolicyRepository {

  // ─── Default Leave Types Seeding (19 Types) ──────────────────────────────
  async seedDefaultLeaveTypes() {
    const defaultTypes = [
      { name: 'Casual Leave', code: 'CASUAL', days_allowed: 12, color: '#3B82F6', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 3, requires_attachment: false, description: 'Short unplanned personal leave' },
      { name: 'Sick Leave', code: 'SICK', days_allowed: 10, color: '#EF4444', is_paid: true, is_carry_forward: true, is_encashable: false, max_consecutive_days: 7, requires_attachment: true, description: 'Medical leave with doctor note for >2 days' },
      { name: 'Earned Leave', code: 'EARNED', days_allowed: 15, color: '#10B981', is_paid: true, is_carry_forward: true, is_encashable: true, max_consecutive_days: 30, requires_attachment: false, description: 'Accrued annual vacation leave' },
      { name: 'Privilege Leave', code: 'PRIVILEGE', days_allowed: 15, color: '#8B5CF6', is_paid: true, is_carry_forward: true, is_encashable: true, max_consecutive_days: 30, requires_attachment: false, description: 'Privilege annual vacation leave' },
      { name: 'Maternity Leave', code: 'MATERNITY', days_allowed: 180, color: '#EC4899', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 180, requires_attachment: true, description: 'Statutory 26-week maternity benefit' },
      { name: 'Paternity Leave', code: 'PATERNITY', days_allowed: 15, color: '#0284C7', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 15, requires_attachment: true, description: 'New parent leave for fathers' },
      { name: 'Marriage Leave', code: 'MARRIAGE', days_allowed: 5, color: '#F59E0B', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 7, requires_attachment: true, description: 'One-time marriage leave' },
      { name: 'Bereavement Leave', code: 'BEREAVEMENT', days_allowed: 5, color: '#64748B', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 5, requires_attachment: false, description: 'Compassionate leave for immediate family' },
      { name: 'Compensatory Off', code: 'COMP_OFF', days_allowed: 0, color: '#14B8A6', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 3, requires_attachment: false, description: 'Earned by working on weekends or holidays' },
      { name: 'Optional Holiday', code: 'OPTIONAL_HOLIDAY', days_allowed: 2, color: '#A855F7', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 1, requires_attachment: false, description: 'Restricted festival holiday choices' },
      { name: 'Study Leave', code: 'STUDY', days_allowed: 10, color: '#6366F1', is_paid: false, is_carry_forward: false, is_encashable: false, max_consecutive_days: 30, requires_attachment: true, description: 'Professional education or exam leave' },
      { name: 'Loss Of Pay', code: 'LOP', days_allowed: 365, color: '#475569', is_paid: false, is_carry_forward: false, is_encashable: false, max_consecutive_days: 365, requires_attachment: false, description: 'Unpaid leave beyond accrued balance' },
      { name: 'Work From Home Leave', code: 'WFH_LEAVE', days_allowed: 24, color: '#0EA5E9', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 5, requires_attachment: false, description: 'Remote work quota days' },
      { name: 'Emergency Leave', code: 'EMERGENCY', days_allowed: 3, color: '#DC2626', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 3, requires_attachment: false, description: 'Unforeseen urgent situation' },
      { name: 'Special Leave', code: 'SPECIAL', days_allowed: 5, color: '#EAB308', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 5, requires_attachment: false, description: 'Management special discretion leave' },
      { name: 'Birthday Leave', code: 'BIRTHDAY', days_allowed: 1, color: '#F43F5E', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 1, requires_attachment: false, description: 'Birthday celebration day off' },
      { name: 'Volunteer Leave', code: 'VOLUNTEER', days_allowed: 2, color: '#84CC16', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 2, requires_attachment: false, description: 'CSR or community volunteering' },
      { name: 'Sabbatical', code: 'SABBATICAL', days_allowed: 90, color: '#334155', is_paid: false, is_carry_forward: false, is_encashable: false, max_consecutive_days: 90, requires_attachment: true, description: 'Long-term personal career break' },
      { name: 'Custom Leave', code: 'CUSTOM', days_allowed: 5, color: '#06B6D4', is_paid: true, is_carry_forward: false, is_encashable: false, max_consecutive_days: 10, requires_attachment: false, description: 'Custom organization leave' },
    ];

    for (const t of defaultTypes) {
      await dbService.query(
        `INSERT INTO leave_types (name, code, days_allowed, color, is_paid, is_carry_forward, is_encashable, max_consecutive_days, requires_attachment, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name, days_allowed = EXCLUDED.days_allowed, color = EXCLUDED.color,
             is_paid = EXCLUDED.is_paid, is_carry_forward = EXCLUDED.is_carry_forward,
             is_encashable = EXCLUDED.is_encashable, description = EXCLUDED.description`,
        [t.name, t.code, t.days_allowed, t.color, t.is_paid, t.is_carry_forward, t.is_encashable, t.max_consecutive_days, t.requires_attachment, t.description]
      );
    }
  }

  // ─── Leave Types CRUD ────────────────────────────────────────────────────
  async getAllTypes() {
    const res = await dbService.query(`SELECT * FROM leave_types ORDER BY id ASC`);
    return res.rows;
  }

  async createType(data: any) {
    const res = await dbService.query(
      `INSERT INTO leave_types (name, code, color, days_allowed, is_carry_forward, is_paid, is_encashable, max_consecutive_days, requires_attachment, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.name, data.code.toUpperCase(), data.color || '#3B82F6',
        data.days_allowed || 12, data.is_carry_forward ?? true,
        data.is_paid ?? true, data.is_encashable ?? false,
        data.max_consecutive_days || 14, data.requires_attachment ?? false,
        data.description || null,
      ]
    );
    return res.rows[0];
  }

  // ─── Policies CRUD ───────────────────────────────────────────────────────
  async getAllPolicies() {
    const res = await dbService.query(
      `SELECT lp.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color as leave_type_color,
        b.name as branch_name, d.name as department_name,
        (SELECT COUNT(*) FROM leave_policy_assignments lpa WHERE lpa.policy_id = lp.id AND lpa.is_active = true) as assigned_count
       FROM leave_policies lp
       JOIN leave_types lt ON lp.leave_type_id = lt.id
       LEFT JOIN branches b ON lp.branch_id = b.id
       LEFT JOIN departments d ON lp.department_id = d.id
       WHERE lp.deleted_at IS NULL
       ORDER BY lp.created_at DESC`
    );
    return res.rows;
  }

  async getPolicyById(id: number) {
    const res = await dbService.query(
      `SELECT lp.*, lt.name as leave_type_name, lt.code as leave_type_code
       FROM leave_policies lp
       JOIN leave_types lt ON lp.leave_type_id = lt.id
       WHERE lp.id = $1 AND lp.deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createPolicy(dto: LeavePolicyDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO leave_policies (
        name, code, description, leave_type_id, annual_allocation, monthly_accrual,
        max_balance, carry_forward_limit, encashment_limit, half_day_allowed,
        hourly_leave_allowed, negative_balance_allowed, probation_applicable,
        min_notice_days, max_consecutive_days, attachment_required,
        branch_id, department_id, is_active, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$20)
      RETURNING *`,
      [
        dto.name, dto.code.toUpperCase(), dto.description || null,
        dto.leave_type_id, dto.annual_allocation, dto.monthly_accrual ?? (dto.annual_allocation / 12),
        dto.max_balance ?? 30, dto.carry_forward_limit ?? 6, dto.encashment_limit ?? 0,
        dto.half_day_allowed ?? true, dto.hourly_leave_allowed ?? false,
        dto.negative_balance_allowed ?? false, dto.probation_applicable ?? true,
        dto.min_notice_days ?? 0, dto.max_consecutive_days ?? 14,
        dto.attachment_required ?? false, dto.branch_id || null,
        dto.department_id || null, dto.is_active ?? true, creatorId,
      ]
    );

    await this._logAudit(creatorId, 'LEAVE_POLICY_CREATED', `Created leave policy: ${dto.name} [${dto.code}]`);
    return res.rows[0];
  }

  async updatePolicy(id: number, dto: Partial<LeavePolicyDTO>, updaterId: number) {
    const res = await dbService.query(
      `UPDATE leave_policies
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           annual_allocation = COALESCE($3, annual_allocation),
           monthly_accrual = COALESCE($4, monthly_accrual),
           max_balance = COALESCE($5, max_balance),
           carry_forward_limit = COALESCE($6, carry_forward_limit),
           encashment_limit = COALESCE($7, encashment_limit),
           half_day_allowed = COALESCE($8, half_day_allowed),
           negative_balance_allowed = COALESCE($9, negative_balance_allowed),
           probation_applicable = COALESCE($10, probation_applicable),
           min_notice_days = COALESCE($11, min_notice_days),
           max_consecutive_days = COALESCE($12, max_consecutive_days),
           attachment_required = COALESCE($13, attachment_required),
           is_active = COALESCE($14, is_active),
           updated_at = CURRENT_TIMESTAMP, updated_by = $15
       WHERE id = $16 AND deleted_at IS NULL
       RETURNING *`,
      [
        dto.name, dto.description, dto.annual_allocation, dto.monthly_accrual,
        dto.max_balance, dto.carry_forward_limit, dto.encashment_limit,
        dto.half_day_allowed, dto.negative_balance_allowed, dto.probation_applicable,
        dto.min_notice_days, dto.max_consecutive_days, dto.attachment_required,
        dto.is_active, updaterId, id,
      ]
    );

    await this._logAudit(updaterId, 'LEAVE_POLICY_UPDATED', `Updated leave policy #${id}`);
    return res.rows[0];
  }

  async deletePolicy(id: number, deleterId: number) {
    await dbService.query(
      `UPDATE leave_policies SET deleted_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE id = $2`,
      [deleterId, id]
    );
    await this._logAudit(deleterId, 'LEAVE_POLICY_DELETED', `Deleted leave policy #${id}`);
    return { success: true };
  }

  // ─── Policy Assignments ──────────────────────────────────────────────────
  async assignPolicy(dto: PolicyAssignDTO, creatorId: number) {
    return await dbService.transaction(async (client) => {
      const assignRes = await client.query(
        `INSERT INTO leave_policy_assignments (
          policy_id, employee_id, department_id, branch_id, role, employment_type,
          effective_date, expiry_date, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        RETURNING *`,
        [
          dto.policy_id, dto.employee_id || null, dto.department_id || null,
          dto.branch_id || null, dto.role || null, dto.employment_type || null,
          dto.effective_date || new Date().toISOString().split('T')[0],
          dto.expiry_date || null, creatorId,
        ]
      );

      // Load policy details to initialize leave balances
      const polRes = await client.query(`SELECT * FROM leave_policies WHERE id = $1`, [dto.policy_id]);
      const policy = polRes.rows[0];

      if (policy && dto.employee_id) {
        await client.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used_days, remaining_days)
           VALUES ($1, $2, $3, 0, $3)
           ON CONFLICT (employee_id, leave_type_id) DO UPDATE
           SET total_allocated = EXCLUDED.total_allocated,
               remaining_days = EXCLUDED.total_allocated - leave_balances.used_days,
               updated_at = CURRENT_TIMESTAMP`,
          [dto.employee_id, policy.leave_type_id, policy.annual_allocation]
        );
      } else if (policy && dto.department_id) {
        // Bulk apply to all department employees
        const empRes = await client.query(`SELECT id FROM employees WHERE department_id = $1 AND is_deleted = false`, [dto.department_id]);
        for (const e of empRes.rows) {
          await client.query(
            `INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used_days, remaining_days)
             VALUES ($1, $2, $3, 0, $3)
             ON CONFLICT (employee_id, leave_type_id) DO UPDATE
             SET total_allocated = EXCLUDED.total_allocated,
                 remaining_days = EXCLUDED.total_allocated - leave_balances.used_days,
                 updated_at = CURRENT_TIMESTAMP`,
            [e.id, policy.leave_type_id, policy.annual_allocation]
          );
        }
      }

      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'LEAVE_POLICY_ASSIGNED', 'LEAVE', $2)`,
        [creatorId, `Assigned policy #${dto.policy_id} to emp:${dto.employee_id || 'all'} dept:${dto.department_id || 'all'}`]
      );

      return assignRes.rows[0];
    });
  }

  async getAssignments() {
    const res = await dbService.query(
      `SELECT lpa.*, lp.name as policy_name, lp.code as policy_code,
        e.first_name, e.last_name, e.employee_code,
        d.name as department_name, b.name as branch_name
       FROM leave_policy_assignments lpa
       JOIN leave_policies lp ON lpa.policy_id = lp.id
       LEFT JOIN employees e ON lpa.employee_id = e.id
       LEFT JOIN departments d ON lpa.department_id = d.id
       LEFT JOIN branches b ON lpa.branch_id = b.id
       WHERE lpa.deleted_at IS NULL
       ORDER BY lpa.created_at DESC`
    );
    return res.rows;
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  async getSettings() {
    const res = await dbService.query(`SELECT * FROM leave_settings LIMIT 1`);
    if (!res.rows[0]) {
      const init = await dbService.query(
        `INSERT INTO leave_settings (leave_year_start_month, auto_carry_forward, max_negative_days, sandwich_rule_enabled)
         VALUES (1, true, 0, false) RETURNING *`
      );
      return init.rows[0];
    }
    return res.rows[0];
  }

  async updateSettings(data: any) {
    const res = await dbService.query(
      `UPDATE leave_settings
       SET leave_year_start_month = COALESCE($1, leave_year_start_month),
           auto_carry_forward = COALESCE($2, auto_carry_forward),
           max_negative_days = COALESCE($3, max_negative_days),
           sandwich_rule_enabled = COALESCE($4, sandwich_rule_enabled),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM leave_settings LIMIT 1)
       RETURNING *`,
      [data.leave_year_start_month, data.auto_carry_forward, data.max_negative_days, data.sandwich_rule_enabled]
    );
    return res.rows[0];
  }

  // ─── Encashment ───────────────────────────────────────────────────────────
  async requestEncashment(employeeId: number, leaveTypeId: number, days: number) {
    // Check encashment eligibility
    const [balRes, typeRes] = await Promise.all([
      dbService.query(`SELECT * FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2`, [employeeId, leaveTypeId]),
      dbService.query(`SELECT * FROM leave_types WHERE id = $1`, [leaveTypeId]),
    ]);

    const bal = balRes.rows[0];
    const lt = typeRes.rows[0];

    if (!lt?.is_encashable) throw new Error('This leave type is not eligible for encashment.');
    if (!bal || bal.remaining_days < days) throw new Error('Insufficient leave balance for encashment.');

    const dailyRate = 1000; // standard daily rate calculation
    const totalAmount = days * dailyRate;

    const res = await dbService.query(
      `INSERT INTO leave_encashments (employee_id, leave_type_id, days_encashed, amount_per_day, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [employeeId, leaveTypeId, days, dailyRate, totalAmount]
    );

    await this._logAudit(employeeId, 'LEAVE_ENCASH_REQUESTED', `Requested encashment for ${days} days of ${lt.name}`);
    return res.rows[0];
  }

  async getEncashments(employeeId?: number) {
    let sql = `
      SELECT le.*, lt.name as leave_type_name, e.first_name, e.last_name, e.employee_code
      FROM leave_encashments le
      JOIN leave_types lt ON le.leave_type_id = lt.id
      JOIN employees e ON le.employee_id = e.id
    `;
    const params: any[] = [];
    if (employeeId) { sql += ` WHERE le.employee_id = $1`; params.push(employeeId); }
    sql += ` ORDER BY le.created_at DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  private async _logAudit(actorId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details) VALUES ($1, $2, 'LEAVE_POLICY', $3)`,
        [actorId, action, details]
      );
    } catch { /* non-fatal */ }
  }
}

export const leavePolicyRepository = new LeavePolicyRepository();
