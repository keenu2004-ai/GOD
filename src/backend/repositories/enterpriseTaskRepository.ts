import dbService from '../database/db.js';

export interface CreateSprintDTO {
  project_id: number;
  sprint_name: string;
  sprint_goal?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateTaskDTO {
  project_id: number;
  sprint_id?: number;
  title: string;
  description?: string;
  task_type?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status?: string;
  assignee_id?: number;
  story_points?: number;
  due_date?: string;
}

export class EnterpriseTaskRepository {

  // ─── Sprint Engine ────────────────────────────────────────────────────────
  async createSprint(dto: CreateSprintDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO project_sprints (project_id, sprint_name, sprint_goal, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING *`,
      [dto.project_id, dto.sprint_name, dto.sprint_goal || null, dto.start_date || null, dto.end_date || null]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'SPRINT_CREATED', 'TASK_MANAGEMENT', $2)`,
      [creatorId, `Created sprint: ${dto.sprint_name} for Project #${dto.project_id}`]
    );

    return res.rows[0];
  }

  async getSprints(projectId?: number) {
    let sql = `SELECT ps.*, p.name as project_name FROM project_sprints ps JOIN projects p ON ps.project_id = p.id`;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE ps.project_id = $1`;
      params.push(projectId);
    }
    sql += ` ORDER BY ps.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Task Lifecycle & Kanban Engine ───────────────────────────────────────
  async createTask(dto: CreateTaskDTO, creatorId: number) {
    const seqRes = await dbService.query(`SELECT COUNT(*) as count FROM project_tasks`);
    const count = parseInt(seqRes.rows[0]?.count || '0', 10) + 101;
    const taskNum = `TASK-${count}`;

    const res = await dbService.query(
      `INSERT INTO project_tasks (
        task_number, title, description, project_id, sprint_id, task_type, priority, status,
        assignee_id, reporter_id, story_points, due_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        taskNum, dto.title, dto.description || null, dto.project_id, dto.sprint_id || null,
        dto.task_type || 'FEATURE', dto.priority || 'MEDIUM', dto.status || 'TO_DO',
        dto.assignee_id || creatorId, creatorId, dto.story_points || 3, dto.due_date || null, creatorId
      ]
    );
    const task = res.rows[0];

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'TASK_CREATED', 'TASK_MANAGEMENT', $2)`,
      [creatorId, `Created task ${taskNum}: ${dto.title}`]
    );

    return task;
  }

  async updateTaskStatus(taskId: number, status: string, updatedById: number) {
    let progress = 0;
    if (status === 'COMPLETED') progress = 100;
    else if (status === 'IN_PROGRESS' || status === 'IN_REVIEW') progress = 50;

    const res = await dbService.query(
      `UPDATE project_tasks
       SET status = $1, progress_percentage = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, progress, updatedById, taskId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'TASK_STATUS_UPDATED', 'TASK_MANAGEMENT', $2)`,
      [updatedById, `Updated Task #${taskId} status to ${status}`]
    );

    return res.rows[0];
  }

  async getTasks(projectId?: number, sprintId?: number, status?: string, assigneeId?: number) {
    let sql = `
      SELECT pt.*, p.name as project_name, p.code as project_code,
             ps.sprint_name,
             e.first_name as assignee_first, e.last_name as assignee_last, e.employee_code as assignee_code
      FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      LEFT JOIN project_sprints ps ON pt.sprint_id = ps.id
      LEFT JOIN employees e ON pt.assignee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (projectId) { sql += ` AND pt.project_id = $${idx++}`; params.push(projectId); }
    if (sprintId) { sql += ` AND pt.sprint_id = $${idx++}`; params.push(sprintId); }
    if (status) { sql += ` AND pt.status = $${idx++}`; params.push(status); }
    if (assigneeId) { sql += ` AND pt.assignee_id = $${idx++}`; params.push(assigneeId); }

    sql += ` ORDER BY pt.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Subtask Checklists Engine ────────────────────────────────────────────
  async addChecklistItem(taskId: number, itemText: string) {
    const res = await dbService.query(
      `INSERT INTO task_checklists (task_id, item_text) VALUES ($1, $2) RETURNING *`,
      [taskId, itemText]
    );
    return res.rows[0];
  }

  async toggleChecklistItem(itemId: number) {
    const res = await dbService.query(
      `UPDATE task_checklists SET is_completed = NOT is_completed WHERE id = $1 RETURNING *`,
      [itemId]
    );
    return res.rows[0];
  }
}

export const enterpriseTaskRepository = new EnterpriseTaskRepository();
