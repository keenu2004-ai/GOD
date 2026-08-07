import dbService from '../database/db.js';

export class AttendanceAnalyticsRepository {

  // ─── Live KPI Dashboard ───────────────────────────────────────────────────
  async getLiveDashboardKPIs() {
    const todayStr = new Date().toISOString().split('T')[0];

    const [totalRes, todayRes, regRes, leaveRes] = await Promise.all([
      dbService.query(`SELECT COUNT(*) as cnt FROM employees WHERE is_deleted = false AND status = 'ACTIVE'`),
      dbService.query(
        `SELECT
          COUNT(*) as present,
          COUNT(CASE WHEN punch_in IS NOT NULL AND punch_out IS NULL THEN 1 END) as working,
          COUNT(CASE WHEN punch_out IS NOT NULL THEN 1 END) as completed,
          COUNT(CASE WHEN is_late = true THEN 1 END) as late,
          COUNT(CASE WHEN is_overtime = true THEN 1 END) as overtime_count,
          COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END) as half_day,
          COUNT(CASE WHEN status = 'WORK_FROM_HOME' OR status = 'REMOTE' THEN 1 END) as wfh,
          ROUND(AVG(work_hours)::numeric, 2) as avg_work_hours,
          ROUND(SUM(work_hours)::numeric, 2) as total_hours
         FROM attendance WHERE date = $1`,
        [todayStr]
      ),
      dbService.query(
        `SELECT COUNT(*) as pending FROM attendance_regularizations WHERE status = 'PENDING_MANAGER' AND deleted_at IS NULL`
      ),
      dbService.query(
        `SELECT COUNT(*) as on_leave FROM leave_applications
         WHERE status = 'APPROVED' AND $1 BETWEEN start_date AND end_date`,
        [todayStr]
      ),
    ]);

    const total = parseInt(totalRes.rows[0]?.cnt || '0', 10);
    const today = todayRes.rows[0] || {};
    const present = parseInt(today.present || '0', 10);
    const absent = Math.max(0, total - present - parseInt(leaveRes.rows[0]?.on_leave || '0', 10));

    return {
      total_employees: total,
      present_today: present,
      absent_today: absent,
      working_now: parseInt(today.working || '0', 10),
      completed_today: parseInt(today.completed || '0', 10),
      late_today: parseInt(today.late || '0', 10),
      half_day_today: parseInt(today.half_day || '0', 10),
      wfh_today: parseInt(today.wfh || '0', 10),
      on_leave_today: parseInt(leaveRes.rows[0]?.on_leave || '0', 10),
      overtime_count: parseInt(today.overtime_count || '0', 10),
      avg_work_hours: parseFloat(today.avg_work_hours || '0'),
      total_hours_today: parseFloat(today.total_hours || '0'),
      pending_regularizations: parseInt(regRes.rows[0]?.pending || '0', 10),
      attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }

  // ─── Trend Data (30-day rolling) ──────────────────────────────────────────
  async getAttendanceTrend(days = 30) {
    const res = await dbService.query(
      `SELECT
        a.date::text as date,
        COUNT(DISTINCT a.employee_id) as present_count,
        COUNT(DISTINCT CASE WHEN a.is_late THEN a.employee_id END) as late_count,
        COUNT(DISTINCT CASE WHEN a.is_overtime THEN a.employee_id END) as overtime_count,
        ROUND(AVG(a.work_hours)::numeric, 2) as avg_hours,
        COUNT(DISTINCT CASE WHEN a.status = 'HALF_DAY' THEN a.employee_id END) as half_day_count
       FROM attendance a
       WHERE a.date >= CURRENT_DATE - $1::int AND a.date <= CURRENT_DATE
       GROUP BY a.date
       ORDER BY a.date ASC`,
      [days]
    );
    return res.rows;
  }

  // ─── Department Comparison ────────────────────────────────────────────────
  async getDepartmentComparison(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        d.name as department_name,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(a.id) as total_sessions,
        COUNT(CASE WHEN a.is_late THEN 1 END) as late_count,
        COUNT(CASE WHEN a.is_overtime THEN 1 END) as overtime_count,
        ROUND(AVG(a.work_hours)::numeric, 2) as avg_work_hours,
        ROUND(
          (COUNT(DISTINCT a.employee_id)::numeric / NULLIF(COUNT(DISTINCT e.id), 0)) * 100
        , 1) as attendance_rate
       FROM departments d
       JOIN employees e ON e.department_id = d.id AND e.is_deleted = false AND e.status = 'ACTIVE'
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date >= $1 AND a.date <= $2
       GROUP BY d.id, d.name
       ORDER BY attendance_rate DESC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ─── Branch Comparison ────────────────────────────────────────────────────
  async getBranchComparison(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        b.name as branch_name,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(a.id) as total_sessions,
        ROUND(AVG(a.work_hours)::numeric, 2) as avg_work_hours,
        COUNT(CASE WHEN a.is_late THEN 1 END) as late_count,
        ROUND(
          (COUNT(DISTINCT a.employee_id)::numeric / NULLIF(COUNT(DISTINCT e.id), 0)) * 100
        , 1) as attendance_rate
       FROM branches b
       JOIN employees e ON e.branch_id = b.id AND e.is_deleted = false
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date >= $1 AND a.date <= $2
       GROUP BY b.id, b.name
       ORDER BY attendance_rate DESC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ─── Monthly Attendance % (12 months) ────────────────────────────────────
  async getMonthlyTrend(year: number) {
    const res = await dbService.query(
      `SELECT
        TO_CHAR(a.date, 'Mon') as month_short,
        EXTRACT(MONTH FROM a.date) as month_num,
        COUNT(DISTINCT a.employee_id) as unique_employees,
        COUNT(a.id) as total_sessions,
        ROUND(AVG(a.work_hours)::numeric, 2) as avg_hours,
        COUNT(CASE WHEN a.is_late THEN 1 END) as late_count,
        COUNT(CASE WHEN a.is_overtime THEN 1 END) as ot_count
       FROM attendance a
       WHERE EXTRACT(YEAR FROM a.date) = $1
       GROUP BY EXTRACT(MONTH FROM a.date), TO_CHAR(a.date, 'Mon')
       ORDER BY month_num ASC`,
      [year]
    );
    return res.rows;
  }

  // ─── Calendar View (single employee, month) ───────────────────────────────
  async getCalendarMonth(employeeId: number | null, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const params: any[] = [startDate, endDate];
    const empFilter = employeeId ? `AND a.employee_id = $3` : '';
    if (employeeId) params.push(employeeId);

    const [attRes, leaveRes, holRes] = await Promise.all([
      dbService.query(
        `SELECT
          a.date::text as date_str,
          a.employee_id,
          a.punch_in, a.punch_out,
          a.work_hours, a.break_duration_mins,
          a.is_late, a.is_overtime, a.status, a.shift_name
         FROM attendance a
         WHERE a.date >= $1 AND a.date <= $2 ${empFilter}
         ORDER BY a.date, a.punch_in`,
        params
      ),
      dbService.query(
        `SELECT
          generate_series(la.start_date, la.end_date, '1 day'::interval)::date::text as date_str,
          la.employee_id,
          lt.name as leave_type, la.status as leave_status
         FROM leave_applications la
         JOIN leave_types lt ON la.leave_type_id = lt.id
         WHERE la.status = 'APPROVED'
           AND la.start_date <= $2 AND la.end_date >= $1
           ${employeeId ? `AND la.employee_id = $3` : ''}`,
        params
      ),
      dbService.query(
        `SELECT date::text as date_str, name as holiday_name, type as holiday_type
         FROM holidays
         WHERE date >= $1 AND date <= $2 AND is_active = true
         ORDER BY date`,
        [startDate, endDate]
      ),
    ]);

    return {
      attendance: attRes.rows,
      leaves: leaveRes.rows,
      holidays: holRes.rows,
    };
  }

  // ─── Detailed Employee Report ─────────────────────────────────────────────
  async getEmployeeDetailedReport(employeeId: number, startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        a.date::text as date,
        a.punch_in, a.punch_out,
        a.work_hours, a.break_duration_mins,
        a.is_late, a.is_overtime, a.status, a.shift_name,
        e.first_name, e.last_name, e.employee_code, e.designation,
        d.name as department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.employee_id = $1 AND a.date >= $2 AND a.date <= $3
       ORDER BY a.date ASC`,
      [employeeId, startDate, endDate]
    );

    const summary = await dbService.query(
      `SELECT
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'PRESENT' OR status = 'LATE' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END) as half_days,
        COUNT(CASE WHEN is_late = true THEN 1 END) as late_days,
        COUNT(CASE WHEN is_overtime = true THEN 1 END) as overtime_days,
        ROUND(SUM(work_hours)::numeric, 2) as total_work_hours,
        ROUND(AVG(work_hours)::numeric, 2) as avg_work_hours,
        ROUND(SUM(CASE WHEN work_hours > 9 THEN work_hours - 9 ELSE 0 END)::numeric, 2) as total_overtime_hours
       FROM attendance
       WHERE employee_id = $1 AND date >= $2 AND date <= $3`,
      [employeeId, startDate, endDate]
    );

    return { records: res.rows, summary: summary.rows[0] };
  }

  // ─── Late Arrival Report ──────────────────────────────────────────────────
  async getLateArrivalReport(startDate: string, endDate: string, deptId?: number) {
    const conditions = ['a.is_late = true', `a.date >= $1`, `a.date <= $2`];
    const params: any[] = [startDate, endDate];
    if (deptId) { conditions.push(`e.department_id = $3`); params.push(deptId); }

    const res = await dbService.query(
      `SELECT
        e.first_name, e.last_name, e.employee_code, e.designation,
        d.name as department_name,
        a.date::text as date,
        a.punch_in,
        a.shift_name,
        EXTRACT(EPOCH FROM (a.punch_in - (a.date + TIME '09:00')))/60 as late_mins
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.date DESC, late_mins DESC`,
      params
    );
    return res.rows;
  }

  // ─── Overtime Report ──────────────────────────────────────────────────────
  async getOvertimeReport(startDate: string, endDate: string, deptId?: number) {
    const conditions = ['a.is_overtime = true', `a.date >= $1`, `a.date <= $2`];
    const params: any[] = [startDate, endDate];
    if (deptId) { conditions.push(`e.department_id = $3`); params.push(deptId); }

    const res = await dbService.query(
      `SELECT
        e.first_name, e.last_name, e.employee_code,
        d.name as department_name,
        COUNT(a.id) as overtime_days,
        ROUND(SUM(a.work_hours - 9)::numeric, 2) as total_ot_hours,
        ROUND(AVG(a.work_hours - 9)::numeric, 2) as avg_ot_hours
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY e.id, e.first_name, e.last_name, e.employee_code, d.name
       ORDER BY total_ot_hours DESC`,
      params
    );
    return res.rows;
  }

  // ─── Absent Report ────────────────────────────────────────────────────────
  async getAbsentReport(date: string) {
    const res = await dbService.query(
      `SELECT
        e.id, e.first_name, e.last_name, e.employee_code, e.designation, e.email,
        d.name as department_name, b.name as branch_name,
        mgr.first_name as manager_first, mgr.last_name as manager_last
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN employees mgr ON e.reporting_manager_id = mgr.id
       WHERE e.is_deleted = false AND e.status = 'ACTIVE'
         AND e.id NOT IN (SELECT employee_id FROM attendance WHERE date = $1)
         AND e.id NOT IN (SELECT employee_id FROM leave_applications WHERE status = 'APPROVED' AND $1 BETWEEN start_date AND end_date)
       ORDER BY d.name, e.first_name`,
      [date]
    );
    return res.rows;
  }

  // ─── Monthly Summary (all employees) ─────────────────────────────────────
  async getMonthlyAttendanceSummary(year: number, month: number, deptId?: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    const conditions: string[] = [`a.date >= $1`, `a.date <= $2`, `e.is_deleted = false`];
    const params: any[] = [startDate, endDate];
    if (deptId) { conditions.push(`e.department_id = $3`); params.push(deptId); }

    const res = await dbService.query(
      `SELECT
        e.first_name, e.last_name, e.employee_code, e.designation,
        d.name as department_name,
        COUNT(CASE WHEN a.status IN ('PRESENT','LATE') THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'HALF_DAY' THEN 1 END) as half_days,
        COUNT(CASE WHEN a.is_late THEN 1 END) as late_days,
        COUNT(CASE WHEN a.is_overtime THEN 1 END) as overtime_days,
        ROUND(SUM(a.work_hours)::numeric, 2) as total_work_hours,
        ROUND(AVG(a.work_hours)::numeric, 2) as avg_work_hours,
        ROUND(SUM(CASE WHEN a.work_hours > 9 THEN a.work_hours - 9 ELSE 0 END)::numeric, 2) as total_ot_hours
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date >= $1 AND a.date <= $2
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY e.id, e.first_name, e.last_name, e.employee_code, e.designation, d.name
       ORDER BY d.name, e.first_name`,
      params
    );
    return res.rows;
  }

  // ─── Payroll Attendance Sync Data ─────────────────────────────────────────
  async getPayrollAttendanceData(year: number, month: number, employeeId?: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const params: any[] = [startDate, endDate];
    const empFilter = employeeId ? `AND e.id = $3` : '';
    if (employeeId) params.push(employeeId);

    const res = await dbService.query(
      `SELECT
        e.id as employee_id, e.first_name, e.last_name, e.employee_code, e.salary,
        d.name as department_name,
        COUNT(CASE WHEN a.status IN ('PRESENT','LATE') THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'HALF_DAY' THEN 1 END) as half_days,
        COUNT(CASE WHEN a.is_late AND a.work_hours IS NOT NULL THEN 1 END) as late_days,
        COALESCE(
          (SELECT COUNT(*) FROM leave_applications la
           WHERE la.employee_id = e.id AND la.status = 'APPROVED'
             AND la.start_date <= $2 AND la.end_date >= $1), 0
        ) as approved_leave_days,
        ROUND(SUM(CASE WHEN a.work_hours > 9 THEN a.work_hours - 9 ELSE 0 END)::numeric, 2) as total_ot_hours,
        ROUND(SUM(a.work_hours)::numeric, 2) as total_work_hours,
        26 as working_days_in_month,
        ROUND((e.salary / 26)::numeric, 2) as daily_rate,
        ROUND((e.salary / 26 / 9)::numeric, 2) as hourly_rate
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date >= $1 AND a.date <= $2
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.is_deleted = false AND e.status = 'ACTIVE' ${empFilter}
       GROUP BY e.id, e.first_name, e.last_name, e.employee_code, e.salary, d.name
       ORDER BY d.name, e.first_name`,
      params
    );

    // Enrich with calculated values
    return res.rows.map((r: any) => {
      const absentDays = Math.max(0, 26 - parseInt(r.present_days) - parseFloat(r.half_days) * 0.5 - parseInt(r.approved_leave_days));
      const lateDed = parseInt(r.late_days) * (r.daily_rate / 2);
      const absentDed = absentDays * r.daily_rate;
      const halfDayDed = parseFloat(r.half_days) * (r.daily_rate / 2);
      const otPay = parseFloat(r.total_ot_hours) * r.hourly_rate * 1.5;
      const effectiveDays = parseInt(r.present_days) + parseInt(r.approved_leave_days) + parseFloat(r.half_days) * 0.5;
      const grossPay = Math.min(r.salary, effectiveDays * r.daily_rate) + otPay;

      return {
        ...r,
        absent_days: absentDays.toFixed(1),
        late_deduction: lateDed.toFixed(2),
        absent_deduction: absentDed.toFixed(2),
        half_day_deduction: halfDayDed.toFixed(2),
        overtime_pay: otPay.toFixed(2),
        effective_paid_days: effectiveDays.toFixed(1),
        gross_payable: grossPay.toFixed(2),
      };
    });
  }

  // ─── GPS Compliance Report ────────────────────────────────────────────────
  async getGPSComplianceReport(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        e.first_name, e.last_name, e.employee_code,
        d.name as department_name,
        COUNT(a.id) as total_sessions,
        COUNT(CASE WHEN a.punch_in_lat IS NOT NULL THEN 1 END) as gps_sessions,
        COUNT(CASE WHEN a.punch_in_lat IS NULL THEN 1 END) as no_gps_sessions,
        ROUND(
          COUNT(CASE WHEN a.punch_in_lat IS NOT NULL THEN 1 END)::numeric
          / NULLIF(COUNT(a.id), 0) * 100, 1
        ) as gps_compliance_rate
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.date >= $1 AND a.date <= $2
       GROUP BY e.id, e.first_name, e.last_name, e.employee_code, d.name
       ORDER BY gps_compliance_rate ASC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ─── Hourly Punch Distribution ────────────────────────────────────────────
  async getPunchDistribution(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        EXTRACT(HOUR FROM punch_in)::integer as hour,
        COUNT(*) as count
       FROM attendance
       WHERE date >= $1 AND date <= $2 AND punch_in IS NOT NULL
       GROUP BY EXTRACT(HOUR FROM punch_in)
       ORDER BY hour`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ─── Work Hour Distribution (buckets) ────────────────────────────────────
  async getWorkHourDistribution(startDate: string, endDate: string) {
    const res = await dbService.query(
      `SELECT
        CASE
          WHEN work_hours < 4  THEN '< 4h'
          WHEN work_hours < 6  THEN '4–6h'
          WHEN work_hours < 8  THEN '6–8h'
          WHEN work_hours < 9  THEN '8–9h'
          WHEN work_hours < 10 THEN '9–10h'
          ELSE '> 10h'
        END as bucket,
        COUNT(*) as count
       FROM attendance
       WHERE date >= $1 AND date <= $2 AND work_hours IS NOT NULL AND work_hours > 0
       GROUP BY bucket ORDER BY MIN(work_hours)`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ─── Export audit log ─────────────────────────────────────────────────────
  async logExport(actorId: number, reportType: string, format: string, filters: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'REPORT_EXPORTED', 'ATTENDANCE_ANALYTICS', $2)`,
        [actorId, `${reportType} exported as ${format}. Filters: ${filters}`]
      );
    } catch { /* non-fatal */ }
  }
}

export const analyticsRepository = new AttendanceAnalyticsRepository();
