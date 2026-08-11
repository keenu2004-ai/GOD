import dbService from '../database/db.js';

export interface AddWeeklyTaskDTO {
  employee_id: number;
  week_number: number;
  year: number;
  day_of_week: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  task_name: string;
  planned_hours?: number;
  project_id?: number;
}

export class WeeklyPlannerRepository {

  // ─── Weekly Plan Lifecycle ────────────────────────────────────────────────
  async getOrCreateWeeklyPlan(employeeId: number, weekNumber: number, year: number, assignerId?: number) {
    await dbService.query(`
      CREATE TABLE IF NOT EXISTS weekly_plans (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        week_number INTEGER NOT NULL,
        year INTEGER NOT NULL,
        assigned_by INTEGER REFERENCES employees(id),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, week_number, year)
      );

      CREATE TABLE IF NOT EXISTS weekly_plan_items (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
        day_of_week VARCHAR(20) NOT NULL,
        task_name TEXT NOT NULL,
        planned_hours NUMERIC(4, 2) DEFAULT 8.0,
        actual_hours NUMERIC(4, 2) DEFAULT 0.0,
        status VARCHAR(30) DEFAULT 'PLANNED',
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const res = await dbService.query(
      `INSERT INTO weekly_plans (employee_id, week_number, year, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (employee_id, week_number, year) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [employeeId, weekNumber, year, assignerId || employeeId]
    );
    return res.rows[0];
  }

  async addWeeklyTaskItem(dto: AddWeeklyTaskDTO, creatorId: number) {
    const plan = await this.getOrCreateWeeklyPlan(dto.employee_id, dto.week_number, dto.year, creatorId);

    const itemRes = await dbService.query(
      `INSERT INTO weekly_plan_items (plan_id, day_of_week, task_name, planned_hours, status, project_id)
       VALUES ($1, $2, $3, $4, 'PLANNED', $5) RETURNING *`,
      [plan.id, dto.day_of_week, dto.task_name, dto.planned_hours || 8.0, dto.project_id || null]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'WEEKLY_TASK_ADDED', 'WEEKLY_PLANNER', $2)`,
      [creatorId, `Added weekly task '${dto.task_name}' for ${dto.day_of_week} (Week ${dto.week_number})`]
    );

    return itemRes.rows[0];
  }

  async updatePlanItemStatus(itemId: number, status: string, actualHours?: number) {
    const res = await dbService.query(
      `UPDATE weekly_plan_items
       SET status = $1, actual_hours = COALESCE($2, actual_hours), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, actualHours ?? null, itemId]
    );
    return res.rows[0];
  }

  async getPlanDetails(employeeId: number, weekNumber: number, year: number) {
    const planRes = await dbService.query(
      `SELECT wp.*, e.first_name, e.last_name, e.employee_code
       FROM weekly_plans wp
       JOIN employees e ON wp.employee_id = e.id
       WHERE wp.employee_id = $1 AND wp.week_number = $2 AND wp.year = $3`,
      [employeeId, weekNumber, year]
    );
    const plan = planRes.rows[0];
    if (!plan) return { plan: null, items: [] };

    const itemsRes = await dbService.query(
      `SELECT wpi.*, p.name as project_name, p.code as project_code
       FROM weekly_plan_items wpi
       LEFT JOIN projects p ON wpi.project_id = p.id
       WHERE wpi.plan_id = $1
       ORDER BY wpi.created_at ASC`,
      [plan.id]
    );

    return { plan, items: itemsRes.rows };
  }

  // ─── Team Workload & Capacity Planning Calculator ────────────────────────
  async getTeamCapacityPlan(departmentId?: number, weekNumber = 32, year = 2026) {
    let sql = `
      SELECT e.id as employee_id, e.first_name, e.last_name, e.employee_code, d.name as department_name,
             COALESCE(SUM(wpi.planned_hours), 0) as total_planned_hours,
             COALESCE(SUM(wpi.actual_hours), 0) as total_actual_hours,
             COUNT(wpi.id) as task_count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN weekly_plans wp ON e.id = wp.employee_id AND wp.week_number = $1 AND wp.year = $2
      LEFT JOIN weekly_plan_items wpi ON wp.id = wpi.plan_id
      WHERE e.is_deleted = false
    `;
    const params: any[] = [weekNumber, year];
    if (departmentId) {
      sql += ` AND e.department_id = $3`;
      params.push(departmentId);
    }
    sql += ` GROUP BY e.id, d.name ORDER BY total_planned_hours DESC`;

    const res = await dbService.query(sql, params);

    return res.rows.map(r => {
      const hours = parseFloat(r.total_planned_hours || '0');
      let status = 'BALANCED'; // 30-40h
      if (hours > 40) status = 'OVERLOADED';
      else if (hours < 30) status = 'UNDERUTILIZED';
      return { ...r, workload_status: status, capacity_utilization_pct: Math.min(100, Math.round((hours / 40) * 100)) };
    });
  }

  // ─── Excel / CSV Importer & Exporter ──────────────────────────────────────
  async exportScheduleCSV(weekNumber: number, year: number) {
    const res = await dbService.query(
      `SELECT e.employee_code, e.first_name, e.last_name, wpi.day_of_week, wpi.task_name, wpi.planned_hours, wpi.status
       FROM weekly_plan_items wpi
       JOIN weekly_plans wp ON wpi.plan_id = wp.id
       JOIN employees e ON wp.employee_id = e.id
       WHERE wp.week_number = $1 AND wp.year = $2
       ORDER BY e.first_name ASC, wpi.created_at ASC`,
      [weekNumber, year]
    );

    let csv = `Employee Code,Employee Name,Day of Week,Task Name,Planned Hours,Status\n`;
    for (const r of res.rows) {
      csv += `"${r.employee_code}","${r.first_name} ${r.last_name}","${r.day_of_week}","${r.task_name}",${r.planned_hours},"${r.status}"\n`;
    }
    return { filename: `WEEKLY_SCHEDULE_WEEK_${weekNumber}_${year}.csv`, content: csv };
  }
}

export const weeklyPlannerRepository = new WeeklyPlannerRepository();
