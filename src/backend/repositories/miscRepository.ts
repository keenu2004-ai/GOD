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

export const helpdeskRepository = new HelpdeskRepository();
export const branchRepository = new BranchRepository();
export const documentRepository = new DocumentRepository();
export const timesheetRepository = new TimesheetRepository();
export const performanceRepository = new PerformanceRepository();
export const plannerRepository = new PlannerRepository();
