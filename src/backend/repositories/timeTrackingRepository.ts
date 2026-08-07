import dbService from '../database/db.js';

export interface LogTimeEntryDTO {
  employee_id: number;
  project_id?: number;
  task_id?: number;
  entry_date: string;
  hours_worked: number;
  is_billable?: boolean;
  is_overtime?: boolean;
  description?: string;
}

export class TimeTrackingRepository {

  // ─── Live Work Session Timer Engine ───────────────────────────────────────
  async startTimer(employeeId: number, projectId?: number, taskId?: number) {
    const res = await dbService.query(
      `INSERT INTO active_work_timers (employee_id, project_id, task_id, start_time, is_paused, accum_seconds)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false, 0)
       ON CONFLICT (employee_id) DO UPDATE SET
         project_id = EXCLUDED.project_id,
         task_id = EXCLUDED.task_id,
         start_time = CURRENT_TIMESTAMP,
         is_paused = false,
         accum_seconds = 0
       RETURNING *`,
      [employeeId, projectId || null, taskId || null]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'TIMER_STARTED', 'TIME_TRACKING', $2)`,
      [employeeId, `Started live work session timer`]
    );

    return res.rows[0];
  }

  async stopTimer(employeeId: number, description?: string) {
    const timerRes = await dbService.query(`SELECT * FROM active_work_timers WHERE employee_id = $1`, [employeeId]);
    const timer = timerRes.rows[0];
    if (!timer) throw new Error('No active timer running');

    const elapsedSeconds = Math.max(60, Math.floor((Date.now() - new Date(timer.start_time).getTime()) / 1000) + (timer.accum_seconds || 0));
    const hoursWorked = Math.round((elapsedSeconds / 3600) * 100) / 100;
    const today = new Date().toISOString().split('T')[0];

    // Delete active timer
    await dbService.query(`DELETE FROM active_work_timers WHERE employee_id = $1`, [employeeId]);

    // Insert completed time entry
    const entryRes = await dbService.query(
      `INSERT INTO time_entries (
        employee_id, project_id, task_id, entry_date, hours_worked, is_billable, is_overtime, description
      ) VALUES ($1, $2, $3, $4, $5, true, false, $6) RETURNING *`,
      [employeeId, timer.project_id, timer.task_id, today, hoursWorked, description || 'Live session work logged']
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'TIMER_STOPPED', 'TIME_TRACKING', $2)`,
      [employeeId, `Stopped timer. Logged ${hoursWorked} hrs for ${today}`]
    );

    return { timer_stopped: true, time_entry: entryRes.rows[0] };
  }

  async getActiveTimer(employeeId: number) {
    const res = await dbService.query(`SELECT * FROM active_work_timers WHERE employee_id = $1`, [employeeId]);
    return res.rows[0] || null;
  }

  // ─── Manual Time Entry & Weekly Timesheets ────────────────────────────────
  async logTimeEntry(dto: LogTimeEntryDTO) {
    const res = await dbService.query(
      `INSERT INTO time_entries (
        employee_id, project_id, task_id, entry_date, hours_worked, is_billable, is_overtime, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        dto.employee_id, dto.project_id || null, dto.task_id || null, dto.entry_date,
        dto.hours_worked, dto.is_billable ?? true, dto.is_overtime ?? false, dto.description || null
      ]
    );
    return res.rows[0];
  }

  async getTimesheetEntries(employeeId: number, startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT te.*, p.name as project_name, p.code as project_code, pt.title as task_title
       FROM time_entries te
       LEFT JOIN projects p ON te.project_id = p.id
       LEFT JOIN project_tasks pt ON te.task_id = pt.id
       WHERE te.employee_id = $1 AND te.entry_date BETWEEN $2 AND $3
       ORDER BY te.entry_date ASC`,
      [employeeId, startDate, endDate]
    );
    return res.rows;
  }

  // ─── Manager Timesheet Approval Workflow ──────────────────────────────────
  async submitTimesheet(employeeId: number, weekNumber: number, year: number, totalHours: number, billableHours: number) {
    const res = await dbService.query(
      `INSERT INTO timesheet_approvals (employee_id, week_number, year, total_hours, billable_hours, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       ON CONFLICT (employee_id, week_number, year) DO UPDATE SET
         total_hours = EXCLUDED.total_hours,
         billable_hours = EXCLUDED.billable_hours,
         status = 'PENDING',
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [employeeId, weekNumber, year, totalHours, billableHours]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'TIMESHEET_SUBMITTED', 'TIME_TRACKING', $2)`,
      [employeeId, `Submitted weekly timesheet for Week ${weekNumber}, ${year} (${totalHours} hrs)`]
    );

    return res.rows[0];
  }

  async approveTimesheet(approvalId: number, managerId: number) {
    const res = await dbService.query(
      `UPDATE timesheet_approvals
       SET status = 'APPROVED', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [managerId, approvalId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'TIMESHEET_APPROVED', 'TIME_TRACKING', $2)`,
      [managerId, `Approved Timesheet #${approvalId}`]
    );

    return res.rows[0];
  }

  async getPendingTimesheets() {
    const res = await dbService.query(
      `SELECT ta.*, e.first_name, e.last_name, e.employee_code, d.name as department_name
       FROM timesheet_approvals ta
       JOIN employees e ON ta.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY ta.created_at DESC`
    );
    return res.rows;
  }

  // ─── Productivity & Utilization BI KPIs ──────────────────────────────────
  async getProductivityKPIs(employeeId?: number) {
    const [totRes, bilRes, ovtRes] = await Promise.all([
      dbService.query(`SELECT COALESCE(SUM(hours_worked), 0) as total FROM time_entries ${employeeId ? `WHERE employee_id = ${employeeId}` : ''}`),
      dbService.query(`SELECT COALESCE(SUM(hours_worked), 0) as total FROM time_entries WHERE is_billable = true ${employeeId ? `AND employee_id = ${employeeId}` : ''}`),
      dbService.query(`SELECT COALESCE(SUM(hours_worked), 0) as total FROM time_entries WHERE is_overtime = true ${employeeId ? `AND employee_id = ${employeeId}` : ''}`),
    ]);

    const total = parseFloat(totRes.rows[0]?.total || '0');
    const billable = parseFloat(bilRes.rows[0]?.total || '0');
    const overtime = parseFloat(ovtRes.rows[0]?.total || '0');

    return {
      total_hours_logged: total,
      billable_hours: billable,
      overtime_hours: overtime,
      billability_percentage: total > 0 ? Math.round((billable / total) * 100) : 0,
    };
  }
}

export const timeTrackingRepository = new TimeTrackingRepository();
