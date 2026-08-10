import dbService from '../database/db.js';

export class ProjectTaskRepository {
  async submitDailyStandup(
    employeeId: number,
    standupDate: string,
    yesterdayWork: string,
    todayPlan: string,
    blockers: string | null,
    notes: string | null
  ) {
    // Upsert logic for standup
    const res = await dbService.query(
      `INSERT INTO daily_standups (employee_id, standup_date, yesterday_work, today_plan, blockers, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, standup_date)
       DO UPDATE SET yesterday_work = EXCLUDED.yesterday_work, today_plan = EXCLUDED.today_plan, blockers = EXCLUDED.blockers, notes = EXCLUDED.notes
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
