import dbService from '../database/db.js';

export interface CreateProjectDTO {
  name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  description: string;
}

export interface CreateTaskDTO {
  project_id: number;
  title: string;
  description: string;
  assigned_to: number;
  due_date: string;
  priority: string;
}

export class ProjectTaskRepository {

  // ─── Master Project Portfolio Engine ───────────────────────────────────────
  async createProject(dto: CreateProjectDTO, creatorId: number) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const code = `PRJ-2026-${num}`;

    const res = await dbService.query(
      `INSERT INTO projects (name, code, description, client_name, start_date, end_date, budget, status, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'IN_PROGRESS', 0) RETURNING *`,
      [dto.name, code, dto.description, dto.client_name, dto.start_date, dto.end_date, dto.budget]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PROJECT_CREATED', 'PROJECTS', $2)`,
      [creatorId, `Created Project ${dto.name} (${code})`]
    );

    return res.rows[0];
  }

  async getProjects() {
    const res = await dbService.query(`SELECT * FROM projects ORDER BY created_at DESC`);
    return res.rows;
  }

  // ─── Task Engine ─────────────────────────────────────────────────
  async createTask(dto: CreateTaskDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO tasks (project_id, title, description, assigned_to, due_date, priority, status, progress_pct)
       VALUES ($1, $2, $3, $4, $5, $6, 'TODO', 0) RETURNING *`,
      [dto.project_id, dto.title, dto.description, dto.assigned_to, dto.due_date, dto.priority]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PROJECT_TASK_CREATED', 'PROJECTS', $2)`,
      [creatorId, `Created Task ${dto.title} for Project #${dto.project_id}`]
    );

    return res.rows[0];
  }

  async getTasks(projectId?: number) {
    let sql = `SELECT t.*, e.first_name, e.last_name, p.name as project_name, p.code as project_code
               FROM tasks t
               JOIN projects p ON t.project_id = p.id
               LEFT JOIN employees e ON t.assigned_to = e.id`;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE t.project_id = $1`;
      params.push(projectId);
    }
    sql += ` ORDER BY t.created_at DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async updateTaskStatus(taskId: number, status: string, userRole: string) {
    const res = await dbService.query(
      `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
      [status, taskId]
    );
    return res.rows[0];
  }

  // ─── Real Work Updates & Progress Tracker ─────────────────────────────────
  async submitWorkUpdate(taskId: number, employeeId: number, workCompleted: string, hoursWorked: number, progressPct: number, blockers?: string) {
    const status = progressPct >= 100 ? 'COMPLETED' : 'IN_PROGRESS';

    await dbService.query(
      `UPDATE tasks SET progress_pct = $1, status = $2 WHERE id = $3`,
      [progressPct, status, taskId]
    );

    const updateRes = await dbService.query(
      `INSERT INTO project_work_updates (task_id, employee_id, work_completed, hours_worked, progress_pct, blockers)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [taskId, employeeId, workCompleted, hoursWorked, progressPct, blockers || null]
    );

    // Recalculate Project overall progress
    const taskRes = await dbService.query(`SELECT project_id FROM tasks WHERE id = $1`, [taskId]);
    const projId = taskRes.rows[0]?.project_id;
    if (projId) {
      const avgRes = await dbService.query(`SELECT AVG(progress_pct) as avg_prog FROM tasks WHERE project_id = $1`, [projId]);
      const avgProg = Math.round(Number(avgRes.rows[0]?.avg_prog || 0));
      await dbService.query(`UPDATE projects SET progress = $1 WHERE id = $2`, [avgProg, projId]);
    }

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'WORK_UPDATE_SUBMITTED', 'PROJECTS', $2)`,
      [employeeId, `Submitted Work Update for Task #${taskId}: Progress ${progressPct}%, Hours ${hoursWorked}`]
    );

    return updateRes.rows[0];
  }

  async getWorkUpdates(taskId: number) {
    const res = await dbService.query(
      `SELECT u.*, e.first_name, e.last_name
       FROM project_work_updates u
       JOIN employees e ON u.employee_id = e.id
       WHERE u.task_id = $1
       ORDER BY u.created_at DESC`,
      [taskId]
    );
    return res.rows;
  }

  // ─── Daily Standup Report Engine ──────────────────────────────────────────
  async submitDailyStandup(employeeId: number, standupDate: string, yesterdayWork: string, todayPlan: string, blockers: string | null, notes: string | null) {
    const res = await dbService.query(
      `INSERT INTO daily_standups (employee_id, standup_date, yesterday_work, today_plan, blockers, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, standup_date) 
       DO UPDATE SET yesterday_work = $3, today_plan = $4, blockers = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [employeeId, standupDate, yesterdayWork, todayPlan, blockers, notes]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'STANDUP_SUBMITTED', 'PROJECTS', $2)`,
      [employeeId, `Submitted Daily Standup Report for ${standupDate}`]
    );

    return res.rows[0];
  }

  async getDailyStandups(employeeId?: number, date?: string) {
    let sql = `SELECT s.*, e.first_name, e.last_name, e.employee_code, e.avatar_url, d.name as department_name
               FROM daily_standups s
               JOIN employees e ON s.employee_id = e.id
               LEFT JOIN departments d ON e.department_id = d.id`;
    const params: any[] = [];
    const conditions: string[] = [];
    let idx = 1;

    if (employeeId) {
      conditions.push(`s.employee_id = $${idx}`);
      params.push(employeeId);
      idx++;
    }

    if (date) {
      conditions.push(`s.standup_date = $${idx}::date`);
      params.push(date);
      idx++;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY s.standup_date DESC, s.created_at DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }
}

export const projectTaskRepository = new ProjectTaskRepository();
