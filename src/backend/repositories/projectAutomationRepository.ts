import dbService from '../database/db.js';

export interface BulkTaskUpdateDTO {
  task_ids: number[];
  status?: string;
  priority?: string;
  assignee_id?: number;
  sprint_id?: number;
}

export class ProjectAutomationRepository {

  // ─── Automated Deadline & Overdue Detector ───────────────────────────────
  async checkAndNotifyTaskDeadlines() {
    const today = new Date().toISOString().split('T')[0];

    // Mark overdue tasks
    const overdueRes = await dbService.query(
      `UPDATE project_tasks
       SET status = 'OVERDUE', updated_at = CURRENT_TIMESTAMP
       WHERE due_date < $1 AND status NOT IN ('COMPLETED', 'OVERDUE')
       RETURNING id, title, assignee_id, project_id`,
      [today]
    );

    for (const task of overdueRes.rows) {
      if (task.assignee_id) {
        await dbService.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, 'Task Overdue Alert', $2, 'TASK_OVERDUE')`,
          [task.assignee_id, `Task '${task.title}' is overdue! Please update status.`]
        );
      }
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'TASK_AUTOMATION_OVERDUE', 'PROJECT_AUTOMATION', $2)`,
        [task.assignee_id || 1, `Automated engine marked task #${task.id} as OVERDUE`]
      );

      // Trigger health recalculation for affected project
      await this.recalculateProjectHealth(task.project_id);
    }

    return { overdue_tasks_marked: overdueRes.rows.length, tasks: overdueRes.rows };
  }

  // ─── Automated Project Health Calculator ──────────────────────────────────
  async recalculateProjectHealth(projectId: number) {
    const [overdueRes, blockedRes, prjRes] = await Promise.all([
      dbService.query(`SELECT COUNT(*) as count FROM project_tasks WHERE project_id = $1 AND (status = 'OVERDUE' OR (due_date < CURRENT_DATE AND status != 'COMPLETED'))`, [projectId]),
      dbService.query(`SELECT COUNT(*) as count FROM project_tasks WHERE project_id = $1 AND status = 'BLOCKED'`, [projectId]),
      dbService.query(`SELECT * FROM projects WHERE id = $1`, [projectId]),
    ]);

    const overdueCount = parseInt(overdueRes.rows[0]?.count || '0', 10);
    const blockedCount = parseInt(blockedRes.rows[0]?.count || '0', 10);

    let healthStatus = 'HEALTHY';
    if (overdueCount >= 3 || blockedCount >= 2) {
      healthStatus = 'CRITICAL';
    } else if (overdueCount >= 1 || blockedCount >= 1) {
      healthStatus = 'AT_RISK';
    }

    await dbService.query(
      `UPDATE projects SET health_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [healthStatus, projectId]
    );

    return { project_id: projectId, health_status: healthStatus, overdue_tasks: overdueCount, blocked_tasks: blockedCount };
  }

  // ─── Bulk Task Operations ────────────────────────────────────────────────
  async bulkUpdateTasks(dto: BulkTaskUpdateDTO, managerId: number) {
    if (!dto.task_ids || dto.task_ids.length === 0) {
      throw new Error('No task IDs provided for bulk update');
    }

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.status) { updates.push(`status = $${idx++}`); params.push(dto.status); }
    if (dto.priority) { updates.push(`priority = $${idx++}`); params.push(dto.priority); }
    if (dto.assignee_id) { updates.push(`assignee_id = $${idx++}`); params.push(dto.assignee_id); }
    if (dto.sprint_id) { updates.push(`sprint_id = $${idx++}`); params.push(dto.sprint_id); }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `UPDATE project_tasks SET ${updates.join(', ')} WHERE id = ANY($${idx++}) RETURNING *`;
    params.push(dto.task_ids);

    const res = await dbService.query(sql, params);

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'BULK_TASK_UPDATE', 'PROJECT_AUTOMATION', $2)`,
      [managerId, `Bulk updated ${res.rows.length} tasks`]
    );

    return res.rows;
  }

  // ─── Global Enterprise Project & Task Search Engine ────────────────────────
  async globalSearch(query: string, userId?: number) {
    const q = `%${query}%`;
    const [prjRes, tskRes, msRes] = await Promise.all([
      dbService.query(
        `SELECT id, name as title, code as subtitle, 'PROJECT' as type, status
         FROM projects
         WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 10`,
        [q]
      ),
      dbService.query(
        `SELECT id, title, task_number as subtitle, 'TASK' as type, status
         FROM project_tasks
         WHERE title ILIKE $1 OR task_number ILIKE $1 LIMIT 15`,
        [q]
      ),
      dbService.query(
        `SELECT id, milestone_name as title, status as subtitle, 'MILESTONE' as type, status
         FROM project_milestones
         WHERE milestone_name ILIKE $1 LIMIT 10`,
        [q]
      ),
    ]);

    return {
      query,
      results: [
        ...prjRes.rows.map(r => ({ ...r, category: 'Projects' })),
        ...tskRes.rows.map(r => ({ ...r, category: 'Tasks' })),
        ...msRes.rows.map(r => ({ ...r, category: 'Milestones' })),
      ]
    };
  }
}

export const projectAutomationRepository = new ProjectAutomationRepository();
