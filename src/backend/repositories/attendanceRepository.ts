import dbService from '../database/db.js';

export interface PunchInDTO {
  employeeId: number;
  date: string;
  punchInTime: Date;
  lat?: number;
  lng?: number;
  shiftName: string;
  isLate: boolean;
  status: string;
}

export interface PunchOutDTO {
  attendanceId: number;
  punchOutTime: Date;
  lat?: number;
  lng?: number;
  workHours: number;
  isOvertime: boolean;
  status: string;
}

export class AttendanceRepository {
  async findTodayRecord(employeeId: number, dateStr: string) {
    const res = await dbService.query(
      `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 LIMIT 1`,
      [employeeId, dateStr]
    );
    return res.rows[0] || null;
  }

  async findById(id: number) {
    const res = await dbService.query(
      `SELECT * FROM attendance WHERE id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createPunchIn(dto: PunchInDTO) {
    const res = await dbService.query(
      `INSERT INTO attendance (
        employee_id, date, punch_in, punch_in_lat, punch_in_lng,
        shift_name, is_late, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        dto.employeeId,
        dto.date,
        dto.punchInTime,
        dto.lat || null,
        dto.lng || null,
        dto.shiftName,
        dto.isLate,
        dto.status,
      ]
    );
    return res.rows[0];
  }

  async updatePunchOut(dto: PunchOutDTO) {
    const res = await dbService.query(
      `UPDATE attendance
       SET punch_out = $1, punch_out_lat = $2, punch_out_lng = $3,
           work_hours = $4, is_overtime = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [
        dto.punchOutTime,
        dto.lat || null,
        dto.lng || null,
        dto.workHours,
        dto.isOvertime,
        dto.status,
        dto.attendanceId,
      ]
    );
    return res.rows[0];
  }

  async updateBreakDuration(attendanceId: number, totalBreakMins: number) {
    const res = await dbService.query(
      `UPDATE attendance
       SET break_duration_mins = $1
       WHERE id = $2
       RETURNING *`,
      [totalBreakMins, attendanceId]
    );
    return res.rows[0];
  }

  async getAttendanceHistory(employeeId: number, limit = 30) {
    const res = await dbService.query(
      `SELECT a.*, e.first_name, e.last_name, e.employee_code
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.employee_id = $1
       ORDER BY a.date DESC
       LIMIT $2`,
      [employeeId, limit]
    );
    return res.rows;
  }

  async getMonthlyRecords(employeeId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const res = await dbService.query(
      `SELECT * FROM attendance
       WHERE employee_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [employeeId, startDate, endDate]
    );
    return res.rows;
  }

  async getTodayAllRecords(dateStr: string) {
    const res = await dbService.query(
      `SELECT a.*, e.first_name, e.last_name, e.employee_code, e.avatar_url, d.name as department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.date = $1
       ORDER BY a.punch_in ASC`,
      [dateStr]
    );
    return res.rows;
  }

  async getLiveManagerStats(dateStr: string) {
    const totalEmployeesRes = await dbService.query(`SELECT COUNT(*) as total FROM employees WHERE is_deleted = false AND status = 'ACTIVE'`);
    const totalEmployees = parseInt((totalEmployeesRes.rows[0] as any)?.total || '0', 10);

    const todayAttendanceRes = await dbService.query(
      `SELECT a.*, e.first_name, e.last_name, e.employee_code, e.avatar_url, d.name as department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.date = $1`,
      [dateStr]
    );

    const records = todayAttendanceRes.rows;
    let workingCount = 0;
    let lateCount = 0;
    let completedCount = 0;

    records.forEach((r: any) => {
      if (r.punch_in && !r.punch_out) {
        workingCount++;
      }
      if (r.punch_out) {
        completedCount++;
      }
      if (r.is_late) {
        lateCount++;
      }
    });

    const presentCount = records.length;
    const absentCount = Math.max(0, totalEmployees - presentCount);

    return {
      totalEmployees,
      presentCount,
      workingCount,
      completedCount,
      lateCount,
      absentCount,
      todayRecords: records,
    };
  }

  async getAnalytics(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'LATE' OR is_late = true THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END) as half_day_count,
        COUNT(CASE WHEN status = 'REMOTE' OR status = 'WORK_FROM_HOME' THEN 1 END) as remote_count,
        COUNT(CASE WHEN is_overtime = true THEN 1 END) as overtime_count,
        AVG(work_hours) as avg_work_hours
       FROM attendance
       WHERE date >= $1 AND date <= $2`,
      [startDate, endDate]
    );

    const row = res.rows[0] || {};
    return {
      totalRecords: parseInt((row as any).total_records || '0', 10),
      presentCount: parseInt((row as any).present_count || '0', 10),
      lateCount: parseInt((row as any).late_count || '0', 10),
      halfDayCount: parseInt((row as any).half_day_count || '0', 10),
      remoteCount: parseInt((row as any).remote_count || '0', 10),
      overtimeCount: parseInt((row as any).overtime_count || '0', 10),
      avgWorkHours: parseFloat((row as any).avg_work_hours || '0.0').toFixed(2),
    };
  }

  async createAuditLog(employeeId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, $2, 'ATTENDANCE', $3)`,
        [employeeId, action, details]
      );
    } catch (e) {
      // Audit log fallback if table is omitted
      console.log(`[AuditLog] ${action}: ${details}`);
    }
  }
}

export const attendanceRepository = new AttendanceRepository();
