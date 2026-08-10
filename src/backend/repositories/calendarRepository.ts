import db from '../database/db.js';
import { getAppBusinessDate } from '../utils/dateUtils.js';

export interface CreateCalendarTaskDTO {
  title: string;
  description?: string;
  task_date: string;
  start_time?: string;
  end_time?: string;
  priority?: string;
  status?: string;
  assigned_to?: number;
  created_by: number;
  location?: string;
  reminder_at?: string;
}

export interface UpdateCalendarTaskDTO {
  title?: string;
  description?: string;
  task_date?: string;
  start_time?: string;
  end_time?: string;
  priority?: string;
  status?: string;
  assigned_to?: number;
  location?: string;
  reminder_at?: string;
}

export class CalendarRepository {
  async createTask(dto: CreateCalendarTaskDTO) {
    const res = await db.query(
      `INSERT INTO calendar_tasks 
       (title, description, task_date, start_time, end_time, priority, status, assigned_to, created_by, location, reminder_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        dto.title,
        dto.description || null,
        dto.task_date,
        dto.start_time || null,
        dto.end_time || null,
        dto.priority || 'MEDIUM',
        dto.status || 'PENDING',
        dto.assigned_to || dto.created_by,
        dto.created_by,
        dto.location || null,
        dto.reminder_at || null,
      ]
    );
    return res.rows[0];
  }

  async getTasks(assignedTo?: number, startDate?: string, endDate?: string) {
    let sql = `
      SELECT t.*, 
             e.first_name as assignee_first_name, e.last_name as assignee_last_name, e.avatar_url as assignee_avatar,
             c.first_name as creator_first_name, c.last_name as creator_last_name
      FROM calendar_tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN employees c ON t.created_by = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (assignedTo) {
      sql += ` AND (t.assigned_to = $${idx} OR t.created_by = $${idx})`;
      params.push(assignedTo);
      idx++;
    }
    if (startDate) {
      sql += ` AND t.task_date >= $${idx}`;
      params.push(startDate);
      idx++;
    }
    if (endDate) {
      sql += ` AND t.task_date <= $${idx}`;
      params.push(endDate);
      idx++;
    }

    sql += ` ORDER BY t.task_date ASC, t.start_time ASC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  async getTaskById(id: number) {
    const res = await db.query(
      `SELECT t.*, e.first_name as assignee_first_name, e.last_name as assignee_last_name
       FROM calendar_tasks t
       LEFT JOIN employees e ON t.assigned_to = e.id
       WHERE t.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async updateTask(id: number, dto: UpdateCalendarTaskDTO) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    Object.entries(dto).forEach(([key, val]) => {
      if (val !== undefined) {
        fields.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 1) {
      return this.getTaskById(id);
    }

    params.push(id);
    const sql = `UPDATE calendar_tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  async deleteTask(id: number) {
    const res = await db.query(`DELETE FROM calendar_tasks WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  }

  async getHolidays(startDate: string, endDate: string) {
    const res = await db.query(
      `SELECT * FROM holidays WHERE date >= $1 AND date <= $2 ORDER BY date ASC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  async getLeaves(startDate: string, endDate: string, employeeId?: number) {
    let sql = `
      SELECT l.*, e.first_name, e.last_name, e.employee_code, e.avatar_url
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.start_date <= $2 AND l.end_date >= $1 AND l.status IN ('APPROVED', 'PENDING', 'MANAGER_PENDING', 'HR_PENDING')
    `;
    const params: any[] = [startDate, endDate];
    if (employeeId) {
      sql += ` AND l.employee_id = $3`;
      params.push(employeeId);
    }
    sql += ` ORDER BY l.start_date ASC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  async getAttendance(startDate: string, endDate: string, employeeId?: number) {
    let sql = `
      SELECT a.*, e.first_name, e.last_name, e.employee_code, e.avatar_url
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.date >= $1 AND a.date <= $2
    `;
    const params: any[] = [startDate, endDate];
    if (employeeId) {
      sql += ` AND a.employee_id = $3`;
      params.push(employeeId);
    }
    sql += ` ORDER BY a.date ASC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  async getRegularizations(startDate: string, endDate: string, employeeId?: number) {
    let sql = `
      SELECT ar.*, e.first_name, e.last_name, e.employee_code
      FROM attendance_regularizations ar
      JOIN employees e ON ar.employee_id = e.id
      WHERE ar.attendance_date >= $1 AND ar.attendance_date <= $2
    `;
    const params: any[] = [startDate, endDate];
    if (employeeId) {
      sql += ` AND ar.employee_id = $3`;
      params.push(employeeId);
    }
    sql += ` ORDER BY ar.attendance_date ASC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  async getAnnouncements() {
    const res = await db.query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20`);
    return res.rows;
  }
}

export const calendarRepository = new CalendarRepository();
