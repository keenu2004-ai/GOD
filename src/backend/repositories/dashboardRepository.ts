import dbService from '../database/db.js';

export class DashboardRepository {
  async getMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM employees WHERE is_deleted = false AND status = 'ACTIVE') as total_employees,
        (SELECT COUNT(*) FROM departments) as total_departments,
        (SELECT COUNT(*) FROM branches) as total_branches,
        (SELECT COUNT(*) FROM attendance WHERE date = $1 AND status IN ('PRESENT', 'LATE')) as present_today,
        (SELECT COUNT(*) FROM attendance WHERE date = $1 AND is_late = true) as late_today,
        (SELECT COUNT(*) FROM leave_applications WHERE status IN ('MANAGER_PENDING', 'HR_PENDING', 'PENDING')) as pending_leaves,
        (SELECT COUNT(*) FROM expenses WHERE status = 'PENDING') as pending_expenses,
        (SELECT COUNT(*) FROM projects WHERE status = 'IN_PROGRESS') as active_projects
    `;

    const res = await dbService.query(sql, [today]);
    const row = res.rows[0] || {};

    return {
      totalEmployees: parseInt((row as any).total_employees || '0', 10),
      totalDepartments: parseInt((row as any).total_departments || '0', 10),
      totalBranches: parseInt((row as any).total_branches || '0', 10),
      presentToday: parseInt((row as any).present_today || '0', 10),
      lateToday: parseInt((row as any).late_today || '0', 10),
      pendingLeaves: parseInt((row as any).pending_leaves || '0', 10),
      pendingExpenses: parseInt((row as any).pending_expenses || '0', 10),
      activeProjects: parseInt((row as any).active_projects || '0', 10),
    };
  }

  async getRecentActivity() {
    const sql = `
      (SELECT 'ATTENDANCE' as type, e.first_name || ' ' || e.last_name || ' punched in (' || a.status || ')' as title, a.punch_in as timestamp
       FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE a.punch_in IS NOT NULL ORDER BY a.punch_in DESC LIMIT 4)
      UNION ALL
      (SELECT 'LEAVE' as type, e.first_name || ' ' || e.last_name || ' requested ' || l.total_days || ' day leave (' || l.status || ')' as title, l.created_at as timestamp
       FROM leaves l JOIN employees e ON l.employee_id = e.id ORDER BY l.id DESC LIMIT 4)
      UNION ALL
      (SELECT 'EXPENSE' as type, e.first_name || ' ' || e.last_name || ' submitted claim for ₹' || ex.amount as title, ex.created_at as timestamp
       FROM expenses ex JOIN employees e ON ex.employee_id = e.id ORDER BY ex.id DESC LIMIT 4)
      ORDER BY timestamp DESC LIMIT 8
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async getDepartmentDistribution() {
    const sql = `
      SELECT d.name as department, COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_deleted = false
      GROUP BY d.id, d.name
      ORDER BY employee_count DESC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async getPayrollSummary() {
    const sql = `
      SELECT month, year, SUM(gross_salary) as total_gross, SUM(net_salary) as total_net, SUM(pf_deduction + tds_deduction) as total_deductions
      FROM payrolls
      GROUP BY month, year
      ORDER BY year DESC, id DESC LIMIT 6
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async getAnnouncements() {
    const sql = `
      SELECT a.*, e.first_name as author_first_name, e.last_name as author_last_name, e.avatar_url as author_avatar
      FROM announcements a
      JOIN employees e ON a.posted_by = e.id
      ORDER BY a.is_pinned DESC, a.id DESC
      LIMIT 5
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async getCelebrations() {
    const sql = `
      SELECT c.*, e.first_name, e.last_name, e.avatar_url, e.designation, d.name as department_name
      FROM celebrations c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY c.event_date ASC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }
}

export const dashboardRepository = new DashboardRepository();
