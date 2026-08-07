import dbService from '../database/db.js';

export interface CreateProjectDTO {
  name: string;
  code: string;
  description: string;
  project_type?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  manager_id?: number;
  client_id?: number;
}

export interface AddProjectMemberDTO {
  project_id: number;
  employee_id: number;
  role_in_project?: string;
}

export interface AddProjectDocumentDTO {
  project_id: number;
  document_name: string;
  file_url: string;
  file_type?: string;
}

export interface CreateProjectNoteDTO {
  project_id: number;
  title: string;
  note_content: string;
}

export class EnterpriseProjectRepository {

  // ─── Pre-seed Categories & Clients ────────────────────────────────────────
  async seedCategoriesAndClients() {
    const cats = [
      { name: 'Software Development', code: 'DEV', description: 'Core product & custom software engineering' },
      { name: 'Internal HR & Payroll', code: 'HR', description: 'Internal workforce systems & policies' },
      { name: 'Research & Innovation', code: 'RESEARCH', description: 'AI & emerging technology research' },
      { name: 'Maintenance & Operations', code: 'OPS', description: 'Infrastructure, DevOps, & support' },
      { name: 'Client Consulting', code: 'CLIENT', description: 'Enterprise client engagements' },
    ];

    for (const c of cats) {
      await dbService.query(
        `INSERT INTO project_categories (name, code, description) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [c.name, c.code, c.description]
      );
    }
  }

  // ─── Project Lifecycle CRUD ───────────────────────────────────────────────
  async createProject(dto: CreateProjectDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO projects (
        name, code, description, project_type, priority, risk_level, status, budget, start_date, end_date, estimated_hours, manager_id, client_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        dto.name, dto.code.toUpperCase(), dto.description, dto.project_type || 'DEVELOPMENT',
        dto.priority || 'MEDIUM', dto.risk_level || 'LOW', dto.status || 'ACTIVE',
        dto.budget || 0, dto.start_date || null, dto.end_date || null, dto.estimated_hours || 0,
        dto.manager_id || creatorId, dto.client_id || null, creatorId
      ]
    );
    const proj = res.rows[0];

    // Assign Manager as Project Manager member
    await dbService.query(
      `INSERT INTO project_members (project_id, employee_id, role_in_project)
       VALUES ($1, $2, 'PROJECT_MANAGER') ON CONFLICT DO NOTHING`,
      [proj.id, dto.manager_id || creatorId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PROJECT_CREATED', 'PROJECT_MANAGEMENT', $2)`,
      [creatorId, `Created project: ${dto.name} (${dto.code})`]
    );

    return proj;
  }

  async getProjects(statusFilter?: string) {
    let sql = `
      SELECT p.*, e.first_name as manager_first, e.last_name as manager_last, e.employee_code as manager_code,
             COUNT(pm.employee_id) as member_count
      FROM projects p
      LEFT JOIN employees e ON p.manager_id = e.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
    `;
    const params: any[] = [];
    if (statusFilter) {
      sql += ` WHERE p.status = $1`;
      params.push(statusFilter);
    }
    sql += ` GROUP BY p.id, e.id ORDER BY p.created_at DESC`;

    const res = await dbService.query(sql, params);
    
    // Auto-calculate Project Health
    return res.rows.map(p => {
      let health = 'HEALTHY';
      const progress = parseInt(p.progress_percentage || '0', 10);
      if (p.status === 'BLOCKED' || (p.end_date && new Date(p.end_date) < new Date() && progress < 100)) {
        health = 'CRITICAL';
      } else if (progress < 40 && p.status === 'ACTIVE') {
        health = 'ATTENTION_REQUIRED';
      }
      return { ...p, health_status: health };
    });
  }

  async getProjectDetails(projectId: number) {
    const projRes = await dbService.query(
      `SELECT p.*, e.first_name as manager_first, e.last_name as manager_last, e.email as manager_email
       FROM projects p
       LEFT JOIN employees e ON p.manager_id = e.id
       WHERE p.id = $1`,
      [projectId]
    );
    const project = projRes.rows[0];
    if (!project) return null;

    const [membersRes, docsRes, notesRes] = await Promise.all([
      dbService.query(
        `SELECT pm.*, e.first_name, e.last_name, e.employee_code, e.email, d.name as department_name
         FROM project_members pm
         JOIN employees e ON pm.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE pm.project_id = $1`,
        [projectId]
      ),
      dbService.query(`SELECT * FROM project_documents WHERE project_id = $1 ORDER BY created_at DESC`, [projectId]),
      dbService.query(
        `SELECT pn.*, e.first_name, e.last_name
         FROM project_notes pn
         JOIN employees e ON pn.author_id = e.id
         WHERE pn.project_id = $1 ORDER BY pn.created_at DESC`,
        [projectId]
      ),
    ]);

    return {
      project,
      members: membersRes.rows,
      documents: docsRes.rows,
      notes: notesRes.rows,
    };
  }

  // ─── Project Members Assignment ───────────────────────────────────────────
  async addMember(dto: AddProjectMemberDTO, assignerId: number) {
    const res = await dbService.query(
      `INSERT INTO project_members (project_id, employee_id, role_in_project)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, employee_id) DO UPDATE SET role_in_project = EXCLUDED.role_in_project
       RETURNING *`,
      [dto.project_id, dto.employee_id, dto.role_in_project || 'MEMBER']
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PROJECT_MEMBER_ADDED', 'PROJECT_MANAGEMENT', $2)`,
      [assignerId, `Assigned Employee #${dto.employee_id} to Project #${dto.project_id} as ${dto.role_in_project}`]
    );

    return res.rows[0];
  }

  async removeMember(projectId: number, employeeId: number) {
    await dbService.query(`DELETE FROM project_members WHERE project_id = $1 AND employee_id = $2`, [projectId, employeeId]);
  }

  // ─── Project Documents & Notes Engine ─────────────────────────────────────
  async addDocument(dto: AddProjectDocumentDTO, uploaderId: number) {
    const res = await dbService.query(
      `INSERT INTO project_documents (project_id, document_name, file_url, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.project_id, dto.document_name, dto.file_url, dto.file_type || 'PDF', uploaderId]
    );
    return res.rows[0];
  }

  async createNote(dto: CreateProjectNoteDTO, authorId: number) {
    const res = await dbService.query(
      `INSERT INTO project_notes (project_id, title, note_content, author_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [dto.project_id, dto.title, dto.note_content, authorId]
    );
    return res.rows[0];
  }

  // ─── Portfolio BI Dashboard KPIs ──────────────────────────────────────────
  async getProjectDashboardKPIs() {
    const [totRes, actRes, compRes, budRes] = await Promise.all([
      dbService.query(`SELECT COUNT(*) as count FROM projects`),
      dbService.query(`SELECT COUNT(*) as count FROM projects WHERE status IN ('ACTIVE', 'PLANNING')`),
      dbService.query(`SELECT COUNT(*) as count FROM projects WHERE status = 'COMPLETED'`),
      dbService.query(`SELECT COALESCE(SUM(budget), 0) as total_budget FROM projects`),
    ]);

    return {
      total_projects: parseInt(totRes.rows[0]?.count || '0', 10),
      active_projects: parseInt(actRes.rows[0]?.count || '0', 10),
      completed_projects: parseInt(compRes.rows[0]?.count || '0', 10),
      total_portfolio_budget: parseFloat(budRes.rows[0]?.total_budget || '0'),
    };
  }
}

export const enterpriseProjectRepository = new EnterpriseProjectRepository();
