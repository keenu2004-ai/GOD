import dbService from '../database/db.js';

export interface CreateMilestoneDTO {
  project_id: number;
  milestone_name: string;
  planned_date: string;
  owner_id?: number;
}

export interface CreateRiskDTO {
  project_id: number;
  risk_description: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  probability?: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation_plan?: string;
  owner_id?: number;
}

export class ProjectAnalyticsRepository {

  // ─── Executive Portfolio BI KPIs ──────────────────────────────────────────
  async getPortfolioKPIs() {
    const [totRes, actRes, compRes, delRes, riskRes, budRes, avgRes] = await Promise.all([
      dbService.query(`SELECT COUNT(*) as count FROM projects`),
      dbService.query(`SELECT COUNT(*) as count FROM projects WHERE status IN ('ACTIVE', 'PLANNING')`),
      dbService.query(`SELECT COUNT(*) as count FROM projects WHERE status = 'COMPLETED'`),
      dbService.query(`SELECT COUNT(*) as count FROM projects WHERE status = 'BLOCKED' OR (end_date < CURRENT_DATE AND progress_percentage < 100)`),
      dbService.query(`SELECT COUNT(*) as count FROM project_risks WHERE status = 'OPEN' AND severity IN ('CRITICAL', 'HIGH')`),
      dbService.query(`SELECT COALESCE(SUM(budget), 0) as total_budget FROM projects`),
      dbService.query(`SELECT COALESCE(AVG(progress_percentage), 0) as avg_progress FROM projects`),
    ]);

    return {
      total_projects: parseInt(totRes.rows[0]?.count || '0', 10),
      active_projects: parseInt(actRes.rows[0]?.count || '0', 10),
      completed_projects: parseInt(compRes.rows[0]?.count || '0', 10),
      delayed_projects: parseInt(delRes.rows[0]?.count || '0', 10),
      high_risks_count: parseInt(riskRes.rows[0]?.count || '0', 10),
      total_portfolio_budget: parseFloat(budRes.rows[0]?.total_budget || '0'),
      average_completion_pct: Math.round(parseFloat(avgRes.rows[0]?.avg_progress || '0')),
    };
  }

  // ─── Project Milestones Engine ────────────────────────────────────────────
  async createMilestone(dto: CreateMilestoneDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO project_milestones (project_id, milestone_name, planned_date, owner_id, status)
       VALUES ($1, $2, $3, $4, 'PLANNED') RETURNING *`,
      [dto.project_id, dto.milestone_name, dto.planned_date, dto.owner_id || creatorId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'MILESTONE_CREATED', 'PROJECT_ANALYTICS', $2)`,
      [creatorId, `Created milestone '${dto.milestone_name}' for Project #${dto.project_id}`]
    );

    return res.rows[0];
  }

  async getMilestones(projectId?: number) {
    let sql = `
      SELECT pm.*, p.name as project_name, p.code as project_code, e.first_name, e.last_name
      FROM project_milestones pm
      JOIN projects p ON pm.project_id = p.id
      LEFT JOIN employees e ON pm.owner_id = e.id
    `;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE pm.project_id = $1`;
      params.push(projectId);
    }
    sql += ` ORDER BY pm.planned_date ASC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Risk Register & Mitigation Engine ────────────────────────────────────
  async createRisk(dto: CreateRiskDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO project_risks (
        project_id, risk_description, severity, probability, mitigation_plan, owner_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'OPEN') RETURNING *`,
      [
        dto.project_id, dto.risk_description, dto.severity || 'MEDIUM',
        dto.probability || 'MEDIUM', dto.mitigation_plan || null, dto.owner_id || creatorId
      ]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PROJECT_RISK_LOGGED', 'PROJECT_ANALYTICS', $2)`,
      [creatorId, `Logged ${dto.severity || 'MEDIUM'} risk for Project #${dto.project_id}`]
    );

    return res.rows[0];
  }

  async getRisks(projectId?: number) {
    let sql = `
      SELECT pr.*, p.name as project_name, p.code as project_code, e.first_name, e.last_name
      FROM project_risks pr
      JOIN projects p ON pr.project_id = p.id
      LEFT JOIN employees e ON pr.owner_id = e.id
    `;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE pr.project_id = $1`;
      params.push(projectId);
    }
    sql += ` ORDER BY pr.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Department Workload & Resource Utilization Breakdown ─────────────────
  async getDepartmentWorkloadBreakdown() {
    const res = await dbService.query(`
      SELECT d.name as department_name,
             COUNT(DISTINCT e.id) as total_employees,
             COUNT(DISTINCT pt.id) as assigned_tasks,
             COALESCE(SUM(pt.estimated_hours), 0) as total_planned_hours,
             COALESCE(SUM(pt.actual_hours), 0) as total_actual_hours
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_deleted = false
      LEFT JOIN project_tasks pt ON e.id = pt.assignee_id
      GROUP BY d.id, d.name
      ORDER BY total_planned_hours DESC
    `);

    return res.rows.map(r => {
      const planned = parseFloat(r.total_planned_hours || '0');
      const capacity = (parseInt(r.total_employees || '1', 10) || 1) * 40;
      return {
        ...r,
        department_capacity_hours: capacity,
        utilization_pct: Math.min(100, Math.round((planned / capacity) * 100)),
        status: planned > capacity ? 'OVERALLOCATED' : planned < capacity * 0.7 ? 'UNDERUTILIZED' : 'OPTIMAL'
      };
    });
  }

  // ─── Project Budget & Cost Variance Analysis ──────────────────────────────
  async getProjectBudgetVariance() {
    const res = await dbService.query(`
      SELECT p.id, p.name, p.code, p.budget, p.status, p.progress_percentage,
             COALESCE(SUM(te.hours_worked * 500), 0) as estimated_salary_cost,
             (p.budget - COALESCE(SUM(te.hours_worked * 500), 0)) as remaining_budget
      FROM projects p
      LEFT JOIN time_entries te ON p.id = te.project_id
      GROUP BY p.id, p.name, p.code, p.budget, p.status, p.progress_percentage
      ORDER BY p.budget DESC
    `);

    return res.rows.map(r => {
      const budget = parseFloat(r.budget || '0');
      const spent = parseFloat(r.estimated_salary_cost || '0');
      const variance = budget - spent;
      return {
        ...r,
        budget: budget,
        actual_cost: spent,
        budget_variance: variance,
        budget_utilization_pct: budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0,
        budget_status: spent > budget ? 'OVER_BUDGET' : spent > budget * 0.85 ? 'WARNING' : 'ON_TRACK'
      };
    });
  }

  // ─── Portfolio Analytics CSV Exporter ─────────────────────────────────────
  async exportPortfolioCSV() {
    const res = await dbService.query(`
      SELECT p.code, p.name, p.status, p.priority, p.progress_percentage, p.budget,
             e.first_name || ' ' || e.last_name as project_manager
      FROM projects p
      LEFT JOIN employees e ON p.manager_id = e.id
      ORDER BY p.name ASC
    `);

    let csv = `Project Code,Project Name,Manager,Status,Priority,Progress %,Budget (INR)\n`;
    for (const r of res.rows) {
      csv += `"${r.code}","${r.name}","${r.project_manager || 'N/A'}","${r.status}","${r.priority}",${r.progress_percentage},${r.budget}\n`;
    }
    return { filename: `PROJECT_PORTFOLIO_ANALYTICS_REPORT.csv`, content: csv };
  }
}

export const projectAnalyticsRepository = new ProjectAnalyticsRepository();

