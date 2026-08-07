import dbService from '../database/db.js';

export interface SubmitDailyReportDTO {
  employee_id: number;
  report_date: string;
  completed_work: string;
  upcoming_plan?: string;
  blockers?: string;
  hours_worked?: number;
}

export class TaskCollaborationRepository {

  // ─── Daily Work Reporting Engine ──────────────────────────────────────────
  async submitDailyReport(dto: SubmitDailyReportDTO) {
    const res = await dbService.query(
      `INSERT INTO task_daily_reports (
        employee_id, report_date, completed_work, upcoming_plan, blockers, hours_worked, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED') RETURNING *`,
      [dto.employee_id, dto.report_date, dto.completed_work, dto.upcoming_plan || null, dto.blockers || null, dto.hours_worked || 8.0]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'DAILY_REPORT_SUBMITTED', 'TASK_COLLABORATION', $2)`,
      [dto.employee_id, `Submitted daily work standup report for ${dto.report_date}`]
    );

    return res.rows[0];
  }

  async reviewDailyReport(reportId: number, status: 'APPROVED' | 'REJECTED', managerFeedback: string, managerId: number) {
    const res = await dbService.query(
      `UPDATE task_daily_reports
       SET status = $1, manager_feedback = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, managerFeedback || null, managerId, reportId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'DAILY_REPORT_REVIEWED', 'TASK_COLLABORATION', $2)`,
      [managerId, `Reviewed Daily Report #${reportId} as ${status}`]
    );

    return res.rows[0];
  }

  async getDailyReports(employeeId?: number, date?: string) {
    let sql = `
      SELECT tdr.*, e.first_name, e.last_name, e.employee_code, d.name as department_name
      FROM task_daily_reports tdr
      JOIN employees e ON tdr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (employeeId) { sql += ` AND tdr.employee_id = $${idx++}`; params.push(employeeId); }
    if (date) { sql += ` AND tdr.report_date = $${idx++}`; params.push(date); }

    sql += ` ORDER BY tdr.report_date DESC, tdr.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Task Comments & Collaboration Stream ─────────────────────────────────
  async addComment(taskId: number, commentText: string, authorId: number) {
    const res = await dbService.query(
      `INSERT INTO task_comments (task_id, author_id, comment_text) VALUES ($1, $2, $3) RETURNING *`,
      [taskId, authorId, commentText]
    );

    // Track activity feed
    await dbService.query(
      `INSERT INTO task_activity_feed (task_id, actor_id, action_type, details)
       VALUES ($1, $2, 'COMMENT_ADDED', $3)`,
      [taskId, authorId, commentText.slice(0, 100)]
    );

    return res.rows[0];
  }

  async getComments(taskId: number) {
    const res = await dbService.query(
      `SELECT tc.*, e.first_name, e.last_name, e.employee_code
       FROM task_comments tc
       JOIN employees e ON tc.author_id = e.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [taskId]
    );
    return res.rows;
  }

  async getActivityFeed(taskId: number) {
    const res = await dbService.query(
      `SELECT taf.*, e.first_name, e.last_name
       FROM task_activity_feed taf
       LEFT JOIN employees e ON taf.actor_id = e.id
       WHERE taf.task_id = $1
       ORDER BY taf.created_at DESC`,
      [taskId]
    );
    return res.rows;
  }
}

export const taskCollaborationRepository = new TaskCollaborationRepository();
