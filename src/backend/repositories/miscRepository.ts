import dbService from '../database/db.js';

export class HelpdeskRepository {
  async getAll(employeeId?: number) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (employeeId) {
      conditions.push(`h.employee_id = $${idx}`);
      params.push(employeeId);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT h.*, e.first_name, e.last_name, e.employee_code, e.avatar_url,
             a.first_name as assignee_first_name, a.last_name as assignee_last_name
      FROM helpdesk_tickets h
      JOIN employees e ON h.employee_id = e.id
      LEFT JOIN employees a ON h.assigned_to = a.id
      ${whereClause}
      ORDER BY h.id DESC
    `;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async create(employeeId: number, category: string, subject: string, description: string, priority: string = 'MEDIUM') {
    const code = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await dbService.query(
      `INSERT INTO helpdesk_tickets (ticket_code, employee_id, category, subject, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN') RETURNING *`,
      [code, employeeId, category, subject, description, priority]
    );
    return res.rows[0];
  }

  async updateStatus(id: number, status: string, assignedTo?: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets SET status = $1, assigned_to = COALESCE($2, assigned_to) WHERE id = $3 RETURNING *`,
      [status, assignedTo || null, id]
    );
    return res.rows[0];
  }
}

export class BranchRepository {
  async getAll() {
    const sql = `
      SELECT b.*, (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.id AND e.is_deleted = false) as employee_count
      FROM branches b ORDER BY b.is_headquarters DESC, b.id ASC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }
}

export class DocumentRepository {
  async getByEmployee(employeeId: number) {
    const sql = `SELECT * FROM documents WHERE employee_id = $1 ORDER BY id DESC`;
    const res = await dbService.query(sql, [employeeId]);
    return res.rows;
  }

  async create(employeeId: number, title: string, category: string, fileUrl: string) {
    const res = await dbService.query(
      `INSERT INTO documents (employee_id, title, category, file_url) VALUES ($1, $2, $3, $4) RETURNING *`,
      [employeeId, title, category, fileUrl]
    );
    return res.rows[0];
  }
}

export class TimesheetRepository {
  async getByEmployee(employeeId: number) {
    const sql = `
      SELECT t.*, p.name as project_name, p.code as project_code, tk.title as task_title
      FROM timesheets t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN tasks tk ON t.task_id = tk.id
      WHERE t.employee_id = $1 ORDER BY t.date DESC
    `;
    const res = await dbService.query(sql, [employeeId]);
    return res.rows;
  }

  async create(employeeId: number, projectId: number, taskId: number | null, date: string, hoursSpent: number, description: string) {
    const res = await dbService.query(
      `INSERT INTO timesheets (employee_id, project_id, task_id, date, hours_spent, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED') RETURNING *`,
      [employeeId, projectId, taskId || null, date, hoursSpent, description]
    );
    return res.rows[0];
  }
}

export class PerformanceRepository {
  async getAll() {
    const sql = `
      SELECT pr.*, e.first_name, e.last_name, e.employee_code, e.avatar_url, e.designation, d.name as department_name,
             r.first_name as reviewer_first_name, r.last_name as reviewer_last_name
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN employees r ON pr.reviewer_id = r.id
      ORDER BY pr.id DESC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async create(employeeId: number, reviewerId: number, period: string, rating: number, feedback: string, goals: string) {
    const res = await dbService.query(
      `INSERT INTO performance_reviews (employee_id, reviewer_id, review_period, rating, feedback, goals)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employeeId, reviewerId, period, rating, feedback, goals]
    );
    return res.rows[0];
  }
}

export class PlannerRepository {
  async getByEmployee(employeeId: number) {
    const sql = `SELECT * FROM weekly_planners WHERE employee_id = $1 ORDER BY week_start_date DESC, id DESC`;
    const res = await dbService.query(sql, [employeeId]);
    return res.rows;
  }

  async create(employeeId: number, weekStartDate: string, title: string, description: string, priority: string) {
    const res = await dbService.query(
      `INSERT INTO weekly_planners (employee_id, week_start_date, title, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [employeeId, weekStartDate, title, description, priority]
    );
    return res.rows[0];
  }

  async updateStatus(id: number, status: string) {
    const res = await dbService.query(
      `UPDATE weekly_planners SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return res.rows[0];
  }
}

export class SystemConfigRepository {
  async getConfig() {
    const sql = `SELECT * FROM system_config WHERE id = 'MAIN'`;
    const res = await dbService.query(sql);
    if (res.rows.length === 0) {
      return {
        id: 'MAIN',
        company_name: 'THEIAKSHI ENTERPRISES',
        shift_start_time: '09:00',
        shift_end_time: '18:00',
        grace_minutes: 15,
        half_day_threshold_time: '11:30',
        auto_deduct_leave_for_two_half_days: true,
        currency: 'INR',
      };
    }
    return res.rows[0];
  }

  async updateConfig(data: any) {
    const res = await dbService.query(
      `INSERT INTO system_config (id, company_name, shift_start_time, shift_end_time, grace_minutes, half_day_threshold_time, auto_deduct_leave_for_two_half_days, currency)
       VALUES ('MAIN', $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         shift_start_time = EXCLUDED.shift_start_time,
         shift_end_time = EXCLUDED.shift_end_time,
         grace_minutes = EXCLUDED.grace_minutes,
         half_day_threshold_time = EXCLUDED.half_day_threshold_time,
         auto_deduct_leave_for_two_half_days = EXCLUDED.auto_deduct_leave_for_two_half_days,
         currency = EXCLUDED.currency,
         updated_at = NOW()
       RETURNING *`,
      [
        data.company_name || 'THEIAKSHI ENTERPRISES',
        data.shift_start_time || '09:00',
        data.shift_end_time || '18:00',
        data.grace_minutes || 15,
        data.half_day_threshold_time || '11:30',
        data.auto_deduct_leave_for_two_half_days ?? true,
        data.currency || 'INR',
      ]
    );
    return res.rows[0];
  }
}

export class AuditLogRepository {
  async getAuditLogs(limit: number = 50) {
    const sql = `
      SELECT a.*, e.first_name, e.last_name, e.email, e.role
      FROM audit_logs a
      LEFT JOIN employees e ON a.employee_id = e.id
      ORDER BY a.id DESC LIMIT $1
    `;
    const res = await dbService.query(sql, [limit]);
    return res.rows;
  }

  async logAction(employeeId: number | null, action: string, module: string, details: string, ipAddress?: string) {
    try {
      const res = await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details, ip_address)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [employeeId || null, action, module, details, ipAddress || '127.0.0.1']
      );
      return res.rows[0];
    } catch (e) {
      console.log(`[AuditLog Fallback] ${action}: ${details}`);
    }
  }
}

export const helpdeskRepository = new HelpdeskRepository();
export const branchRepository = new BranchRepository();
export const documentRepository = new DocumentRepository();
export const timesheetRepository = new TimesheetRepository();
export const performanceRepository = new PerformanceRepository();
export const plannerRepository = new PlannerRepository();
export const systemConfigRepository = new SystemConfigRepository();
export const auditLogRepository = new AuditLogRepository();
