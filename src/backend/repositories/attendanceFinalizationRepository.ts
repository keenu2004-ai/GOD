import dbService from '../database/db.js';

export class AttendanceFinalizationRepository {

  // ─── Company & Dept Attendance Health Score ──────────────────────────────
  async calculateAttendanceHealthScore(startDate?: string, endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const [statsRes, deptRes] = await Promise.all([
      dbService.query(
        `SELECT
          COUNT(*) as total_records,
          COUNT(CASE WHEN status IN ('PRESENT','LATE') THEN 1 END) as present_cnt,
          COUNT(CASE WHEN is_late = true THEN 1 END) as late_cnt,
          COUNT(CASE WHEN punch_in IS NOT NULL AND punch_out IS NULL AND date < CURRENT_DATE THEN 1 END) as missed_punchout_cnt,
          COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END) as half_day_cnt,
          COUNT(CASE WHEN is_overtime = true THEN 1 END) as ot_cnt,
          ROUND(AVG(work_hours)::numeric, 2) as avg_hours
         FROM attendance
         WHERE date >= $1 AND date <= $2`,
        [start, end]
      ),
      dbService.query(
        `SELECT
          d.id as department_id, d.name as department_name,
          COUNT(a.id) as total_records,
          COUNT(CASE WHEN a.is_late THEN 1 END) as late_cnt,
          ROUND(AVG(a.work_hours)::numeric, 2) as avg_hours,
          ROUND((COUNT(CASE WHEN a.status IN ('PRESENT','LATE') THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 1) as att_rate
         FROM departments d
         LEFT JOIN employees e ON e.department_id = d.id AND e.is_deleted = false
         LEFT JOIN attendance a ON a.employee_id = e.id AND a.date >= $1 AND a.date <= $2
         GROUP BY d.id, d.name
         ORDER BY att_rate DESC`,
        [start, end]
      ),
    ]);

    const s = statsRes.rows[0] || {};
    const totalRecs = parseInt(s.total_records || '0', 10);
    const presentCnt = parseInt(s.present_cnt || '0', 10);
    const lateCnt = parseInt(s.late_cnt || '0', 10);
    const missedOutCnt = parseInt(s.missed_punchout_cnt || '0', 10);

    // Calculate score out of 100
    let healthScore = 100;
    if (totalRecs > 0) {
      const attPct = (presentCnt / totalRecs) * 100;
      const lateDeduction = (lateCnt / totalRecs) * 15;
      const missedDeduction = (missedOutCnt / totalRecs) * 20;
      healthScore = Math.max(0, Math.min(100, Math.round(attPct - lateDeduction - missedDeduction)));
    }

    return {
      overall_health_score: healthScore,
      health_rating: healthScore >= 85 ? 'EXCELLENT' : healthScore >= 70 ? 'GOOD' : healthScore >= 50 ? 'AVERAGE' : 'NEEDS_ATTENTION',
      total_records: totalRecs,
      present_count: presentCnt,
      late_count: lateCnt,
      missed_punchout_count: missedOutCnt,
      avg_work_hours: parseFloat(s.avg_hours || '0'),
      department_health: deptRes.rows,
    };
  }

  // ─── Weekly Planner Sync View ─────────────────────────────────────────────
  async getWeeklyPlannerAttendance(dateStr: string) {
    const res = await dbService.query(
      `SELECT
        e.id as employee_id, e.first_name, e.last_name, e.employee_code,
        a.id as attendance_id, a.punch_in, a.punch_out, a.work_hours,
        a.status as attendance_status, a.is_late, a.is_overtime, a.shift_name,
        la.id as leave_id, lt.name as leave_type
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
       LEFT JOIN leave_applications la ON la.employee_id = e.id AND la.status = 'APPROVED' AND $1 BETWEEN la.start_date AND la.end_date
       LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
       WHERE e.is_deleted = false AND e.status = 'ACTIVE'
       ORDER BY e.first_name`,
      [dateStr]
    );
    return res.rows;
  }

  // ─── Org Chart Live Status Sync ──────────────────────────────────────────
  async getOrgChartLiveStatus() {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await dbService.query(
      `SELECT
        e.id as employee_id, e.first_name, e.last_name, e.reporting_manager_id,
        CASE
          WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 'WORKING'
          WHEN a.punch_out IS NOT NULL THEN 'COMPLETED'
          WHEN la.id IS NOT NULL THEN 'ON_LEAVE'
          WHEN a.id IS NULL THEN 'ABSENT'
          ELSE 'UNKNOWN'
        END as live_status,
        a.punch_in, a.punch_out, a.is_late
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
       LEFT JOIN leave_applications la ON la.employee_id = e.id AND la.status = 'APPROVED' AND $1 BETWEEN la.start_date AND la.end_date
       WHERE e.is_deleted = false AND e.status = 'ACTIVE'`,
      [todayStr]
    );
    return res.rows;
  }

  // ─── Dashboard Integration Live Feed ──────────────────────────────────────
  async getDashboardFeed() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [kpiRes, recentPunches, pendingRegs] = await Promise.all([
      dbService.query(
        `SELECT
          COUNT(DISTINCT e.id) as total_employees,
          COUNT(DISTINCT a.employee_id) as present_today,
          COUNT(CASE WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 1 END) as working_now,
          COUNT(CASE WHEN a.is_late THEN 1 END) as late_today,
          COUNT(CASE WHEN a.is_overtime THEN 1 END) as ot_today
         FROM employees e
         LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
         WHERE e.is_deleted = false AND e.status = 'ACTIVE'`,
        [todayStr]
      ),
      dbService.query(
        `SELECT a.id, a.punch_in, a.is_late, a.status, e.first_name, e.last_name, e.employee_code, d.name as department_name
         FROM attendance a
         JOIN employees e ON a.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE a.date = $1
         ORDER BY a.punch_in DESC LIMIT 5`,
        [todayStr]
      ),
      dbService.query(
        `SELECT COUNT(*) as pending FROM attendance_regularizations WHERE status = 'PENDING_MANAGER' AND deleted_at IS NULL`
      ),
    ]);

    return {
      kpi: kpiRes.rows[0],
      recent_punches: recentPunches.rows,
      pending_regularizations: parseInt(pendingRegs.rows[0]?.pending || '0', 10),
      last_updated: new Date().toISOString(),
    };
  }

  // ─── Audit Log Entry Helper ───────────────────────────────────────────────
  async logAttendanceSystemEvent(actorId: number, event: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, $2, 'ATTENDANCE_SYSTEM', $3)`,
        [actorId, event, details]
      );
    } catch { /* non-fatal */ }
  }
}

export const attendanceFinalizationRepository = new AttendanceFinalizationRepository();
