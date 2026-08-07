import dbService from '../database/db.js';

export class LeaveAnalyticsRepository {

  // ─── Executive Live KPIs ──────────────────────────────────────────────────
  async getExecutiveKPIs() {
    const todayStr = new Date().toISOString().split('T')[0];

    const [reqsRes, leaveTodayRes, deptTopRes, costRes, encashRes] = await Promise.all([
      dbService.query(
        `SELECT
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN status IN ('MANAGER_PENDING', 'HR_PENDING', 'PENDING') THEN 1 END) as pending_count,
          ROUND(AVG(total_days)::numeric, 1) as avg_days_per_request
         FROM leave_applications WHERE deleted_at IS NULL`
      ),
      dbService.query(
        `SELECT COUNT(DISTINCT employee_id) as on_leave_today
         FROM leave_applications
         WHERE status = 'APPROVED' AND deleted_at IS NULL
           AND $1 BETWEEN start_date AND end_date`,
        [todayStr]
      ),
      dbService.query(
        `SELECT d.name as department_name, COUNT(la.id) as leave_count, SUM(la.total_days) as total_days
         FROM leave_applications la
         JOIN employees e ON la.employee_id = e.id
         JOIN departments d ON e.department_id = d.id
         WHERE la.status = 'APPROVED' AND la.deleted_at IS NULL
         GROUP BY d.name
         ORDER BY total_days DESC LIMIT 5`
      ),
      dbService.query(
        `SELECT
          SUM(CASE WHEN lt.is_paid = true THEN la.total_days * 1500 ELSE 0 END) as paid_leave_cost,
          SUM(CASE WHEN lt.is_paid = false OR lt.code = 'LOP' THEN la.total_days * 1500 ELSE 0 END) as lop_deduction_cost
         FROM leave_applications la
         JOIN leave_types lt ON la.leave_type_id = lt.id
         WHERE la.status = 'APPROVED' AND la.deleted_at IS NULL`
      ),
      dbService.query(
        `SELECT SUM(total_amount) as total_encashment_payout, COUNT(*) as encashment_count
         FROM leave_encashments WHERE status = 'APPROVED'`
      ),
    ]);

    const reqs = reqsRes.rows[0] || {};
    const leaveToday = parseInt(leaveTodayRes.rows[0]?.on_leave_today || '0', 10);
    const costs = costRes.rows[0] || {};
    const encash = encashRes.rows[0] || {};

    return {
      total_requests: parseInt(reqs.total_requests || '0', 10),
      approved_count: parseInt(reqs.approved_count || '0', 10),
      rejected_count: parseInt(reqs.rejected_count || '0', 10),
      pending_count: parseInt(reqs.pending_count || '0', 10),
      on_leave_today: leaveToday,
      avg_days_per_request: parseFloat(reqs.avg_days_per_request || '0'),
      top_departments: deptTopRes.rows,
      paid_leave_cost: parseFloat(costs.paid_leave_cost || '0'),
      lop_deduction_cost: parseFloat(costs.lop_deduction_cost || '0'),
      encashment_payout: parseFloat(encash.total_encashment_payout || '0'),
      encashment_count: parseInt(encash.encashment_count || '0', 10),
    };
  }

  // ─── 12-Month Leave Trend (Accrued vs Taken vs Encashment) ────────────────
  async getMonthlyLeaveTrend(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const res = await dbService.query(
      `SELECT
        EXTRACT(MONTH FROM start_date) as month,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_requests,
        SUM(CASE WHEN status = 'APPROVED' THEN total_days ELSE 0 END) as total_leave_days,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_requests
       FROM leave_applications
       WHERE EXTRACT(YEAR FROM start_date) = $1 AND deleted_at IS NULL
       GROUP BY month
       ORDER BY month ASC`,
      [targetYear]
    );

    const monthMap: Record<number, any> = {};
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { month: m, approved_requests: 0, total_leave_days: 0, rejected_requests: 0 };
    }
    for (const r of res.rows) {
      const m = parseInt(r.month, 10);
      monthMap[m] = {
        month: m,
        approved_requests: parseInt(r.approved_requests || '0', 10),
        total_leave_days: parseFloat(r.total_leave_days || '0'),
        rejected_requests: parseInt(r.rejected_requests || '0', 10),
      };
    }
    return Object.values(monthMap);
  }

  // ─── Department Leave Utilization & Cost Breakdown ───────────────────────
  async getDepartmentLeaveAnalytics() {
    const res = await dbService.query(
      `SELECT
        d.id as department_id, d.name as department_name,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(la.id) as total_applications,
        SUM(CASE WHEN la.status = 'APPROVED' THEN la.total_days ELSE 0 END) as approved_days,
        SUM(CASE WHEN la.status = 'APPROVED' AND lt.is_paid = true THEN la.total_days * 1500 ELSE 0 END) as estimated_leave_cost
       FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id AND e.is_deleted = false
       LEFT JOIN leave_applications la ON la.employee_id = e.id AND la.deleted_at IS NULL
       LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
       GROUP BY d.id, d.name
       ORDER BY approved_days DESC`
    );
    return res.rows;
  }

  // ─── Branch Leave Breakdown ──────────────────────────────────────────────
  async getBranchLeaveAnalytics() {
    const res = await dbService.query(
      `SELECT
        b.id as branch_id, b.name as branch_name,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(la.id) as total_applications,
        SUM(CASE WHEN la.status = 'APPROVED' THEN la.total_days ELSE 0 END) as approved_days
       FROM branches b
       LEFT JOIN employees e ON e.branch_id = b.id AND e.is_deleted = false
       LEFT JOIN leave_applications la ON la.employee_id = e.id AND la.deleted_at IS NULL
       GROUP BY b.id, b.name
       ORDER BY approved_days DESC`
    );
    return res.rows;
  }

  // ─── Monthly Leave Heatmap (Days vs Leave Count) ──────────────────────────
  async getLeaveHeatmap(year?: number, month?: number) {
    const yr = year || new Date().getFullYear();
    const mth = month || new Date().getMonth() + 1;
    const startDate = `${yr}-${String(mth).padStart(2, '0')}-01`;
    const endDate = `${yr}-${String(mth).padStart(2, '0')}-31`;

    const res = await dbService.query(
      `SELECT d::date as date, COUNT(la.id) as leave_count
       FROM generate_series($1::date, $2::date, '1 day'::interval) d
       LEFT JOIN leave_applications la ON la.status = 'APPROVED' AND la.deleted_at IS NULL
         AND d::date BETWEEN la.start_date AND la.end_date
       GROUP BY date
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return res.rows;
  }

  // ─── Leave Load Forecast Engine ───────────────────────────────────────────
  async getLeaveForecast() {
    const currentYear = new Date().getFullYear();
    const res = await dbService.query(
      `SELECT
        EXTRACT(MONTH FROM start_date) as month,
        COUNT(*) as historical_leave_count,
        ROUND(AVG(total_days)::numeric, 1) as avg_days
       FROM leave_applications
       WHERE status = 'APPROVED' AND deleted_at IS NULL
       GROUP BY month
       ORDER BY historical_leave_count DESC`
    );

    const peakMonthObj = res.rows[0];
    const peakMonthName = peakMonthObj ? new Date(2026, parseInt(peakMonthObj.month) - 1, 1).toLocaleString('en', { month: 'long' }) : 'November';

    return {
      forecast_year: currentYear,
      peak_leave_month: peakMonthName,
      estimated_monthly_leave_load: res.rows.slice(0, 4),
      risk_level: res.rows.length > 5 ? 'MEDIUM_LEAVE_LOAD' : 'LOW_RISK',
      recommended_action: `Ensure minimum 75% department staffing during peak leave month (${peakMonthName}).`,
    };
  }

  // ─── Audit Log Helper ─────────────────────────────────────────────────────
  async logReportExport(actorId: number, reportType: string, filename: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'LEAVE_REPORT_EXPORTED', 'LEAVE_ANALYTICS', $2)`,
        [actorId, `Exported ${reportType} report to ${filename}`]
      );
    } catch { /* non-fatal */ }
  }
}

export const leaveAnalyticsRepository = new LeaveAnalyticsRepository();
