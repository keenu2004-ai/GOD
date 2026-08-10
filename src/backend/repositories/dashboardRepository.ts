import dbService from '../database/db.js';

export class DashboardRepository {
  async getMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const safeCount = async (sql: string, params: any[] = []): Promise<number> => {
        try {
          const res = await dbService.query(sql, params);
          return parseInt((res.rows[0] as any)?.count || (res.rows[0] as any)?.total || '0', 10);
        } catch (e) {
          return 0;
        }
      };

      const totalEmployees = await safeCount(`SELECT COUNT(*) as count FROM employees WHERE (is_deleted = false OR is_deleted IS NULL) AND status = 'ACTIVE'`);
      const totalDepartments = await safeCount(`SELECT COUNT(*) as count FROM departments`);
      const totalBranches = await safeCount(`SELECT COUNT(*) as count FROM branches`);
      const presentToday = await safeCount(`SELECT COUNT(*) as count FROM attendance WHERE date = $1::date`, [today]);
      const lateToday = await safeCount(`SELECT COUNT(*) as count FROM attendance WHERE date = $1::date AND is_late = true`, [today]);
      const pendingLeaves = await safeCount(`SELECT COUNT(*) as count FROM leaves WHERE status IN ('MANAGER_PENDING', 'HR_PENDING', 'PENDING')`);
      const pendingExpenses = await safeCount(`SELECT COUNT(*) as count FROM expenses WHERE status = 'PENDING'`);
      const openHelpdesk = await safeCount(`SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status IN ('OPEN', 'IN_PROGRESS')`);
      const activeAssets = await safeCount(`SELECT COUNT(*) as count FROM assets WHERE status = 'ALLOCATED'`);
      const todayStandups = await safeCount(`SELECT COUNT(*) as count FROM daily_standups WHERE standup_date = $1::date`, [today]);

      return {
        totalEmployees,
        totalDepartments,
        totalBranches,
        presentToday,
        lateToday,
        pendingLeaves,
        pendingExpenses,
        openHelpdesk,
        activeAssets,
        todayStandups
      };
    } catch (err) {
      return {
        totalEmployees: 0,
        totalDepartments: 0,
        totalBranches: 0,
        presentToday: 0,
        lateToday: 0,
        pendingLeaves: 0,
        pendingExpenses: 0,
        openHelpdesk: 0,
        activeAssets: 0,
        todayStandups: 0
      };
    }
  }

  async getRecentActivity() {
    try {
      const sql = `
        (SELECT 'ATTENDANCE' as type, e.first_name || ' ' || e.last_name || ' punched in' as title, a.punch_in as timestamp
         FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE a.punch_in IS NOT NULL ORDER BY a.id DESC LIMIT 4)
        UNION ALL
        (SELECT 'LEAVE' as type, e.first_name || ' ' || e.last_name || ' requested leave (' || l.status || ')' as title, l.created_at as timestamp
         FROM leaves l JOIN employees e ON l.employee_id = e.id ORDER BY l.id DESC LIMIT 4)
        UNION ALL
        (SELECT 'EXPENSE' as type, e.first_name || ' ' || e.last_name || ' submitted claim for ₹' || ex.amount as title, ex.created_at as timestamp
         FROM expenses ex JOIN employees e ON ex.employee_id = e.id ORDER BY ex.id DESC LIMIT 4)
        ORDER BY timestamp DESC LIMIT 8
      `;
      const res = await dbService.query(sql);
      return res.rows;
    } catch (e) {
      return [];
    }
  }

  async getDepartmentDistribution() {
    try {
      const sql = `
        SELECT d.name as department, COUNT(e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id AND (e.is_deleted = false OR e.is_deleted IS NULL)
        GROUP BY d.id, d.name
        ORDER BY employee_count DESC
      `;
      const res = await dbService.query(sql);
      return res.rows;
    } catch (e) {
      return [];
    }
  }

  async getPayrollSummary() {
    try {
      const sql = `
        SELECT month, year, SUM(gross_salary) as total_gross, SUM(net_salary) as total_net, SUM(pf_deduction + tds_deduction) as total_deductions
        FROM payrolls
        GROUP BY month, year
        ORDER BY id DESC LIMIT 6
      `;
      const res = await dbService.query(sql);
      return res.rows;
    } catch (e) {
      return [];
    }
  }

  async getAnnouncements() {
    try {
      const sql = `
        SELECT a.*, e.first_name as author_first_name, e.last_name as author_last_name, e.avatar_url as author_avatar
        FROM announcements a
        LEFT JOIN employees e ON a.posted_by = e.id
        ORDER BY a.id DESC
        LIMIT 5
      `;
      const res = await dbService.query(sql);
      return res.rows;
    } catch (e) {
      return [];
    }
  }

  async getCelebrations() {
    try {
      const sql = `
        SELECT e.id, e.first_name, e.last_name, e.avatar_url, e.designation, d.name as department_name, 'Birthday' as event_type, e.joining_date as event_date
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.is_deleted = false OR e.is_deleted IS NULL
        LIMIT 5
      `;
      const res = await dbService.query(sql);
      return res.rows;
    } catch (e) {
      return [];
    }
  }

  async getCalendarEvents() {
    try {
      const sql = `
        (SELECT name as title, date::text as event_date, 'HOLIDAY' as category, type as badge FROM holidays WHERE is_active = true)
        UNION ALL
        (SELECT first_name || ' ' || last_name || ' Birthday' as title, CURRENT_DATE::text as event_date, 'BIRTHDAY' as category, 'CELEBRATION' as badge FROM employees WHERE is_deleted = false LIMIT 5)
        ORDER BY event_date ASC LIMIT 10
      `;
      const res = await dbService.query(sql);
      return res.rows;
    } catch (e) {
      return [];
    }
  }

  async getUserPreferences(employeeId: number) {
    try {
      const res = await dbService.query(`SELECT * FROM dashboard_preferences WHERE employee_id = $1`, [employeeId]);
      return res.rows[0] || { theme: 'light', default_tab: 'dashboard' };
    } catch (e) {
      return { theme: 'light', default_tab: 'dashboard' };
    }
  }

  async updateUserPreferences(employeeId: number, theme: string, defaultTab: string) {
    try {
      const res = await dbService.query(
        `INSERT INTO dashboard_preferences (employee_id, theme, default_tab)
         VALUES ($1, $2, $3)
         ON CONFLICT (employee_id) DO UPDATE SET theme = $2, default_tab = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [employeeId, theme, defaultTab]
      );
      return res.rows[0];
    } catch (e) {
      return { employee_id: employeeId, theme, default_tab: defaultTab };
    }
  }
}

export const dashboardRepository = new DashboardRepository();
