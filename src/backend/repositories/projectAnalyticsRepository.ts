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
}

export const projectAnalyticsRepository = new ProjectAnalyticsRepository();
