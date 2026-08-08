import dbService from '../database/db.js';

export interface CreateClientOrgDTO {
  name: string;
  company_name: string;
  contact_person?: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  account_manager_id?: number;
}

export interface CreateDeliverableDTO {
  project_id: number;
  title: string;
  description?: string;
  due_date?: string;
  version?: string;
}

export interface CreateChangeRequestDTO {
  project_id: number;
  title: string;
  description: string;
  reason?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class ClientPortalRepository {

  // ─── Client Account & Project Access Management ───────────────────────────
  async createClientOrganization(dto: CreateClientOrgDTO) {
    const res = await dbService.query(
      `INSERT INTO client_organizations (
        name, company_name, contact_person, email, phone, address, industry, account_manager_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        dto.name, dto.company_name, dto.contact_person || null, dto.email,
        dto.phone || null, dto.address || null, dto.industry || null, dto.account_manager_id || null
      ]
    );
    return res.rows[0];
  }

  async grantProjectAccess(clientOrgId: number, projectId: number, accessLevel = 'FULL', grantedBy?: number) {
    const res = await dbService.query(
      `INSERT INTO client_project_access (client_org_id, project_id, access_level, granted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (client_org_id, project_id) DO UPDATE SET access_level = EXCLUDED.access_level
       RETURNING *`,
      [clientOrgId, projectId, accessLevel, grantedBy || null]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'CLIENT_PROJECT_SHARED', 'CLIENT_PORTAL', $2)`,
      [grantedBy || 1, `Granted ${accessLevel} access for Project #${projectId} to Client Org #${clientOrgId}`]
    );

    return res.rows[0];
  }

  async getClientProjects(clientOrgId?: number) {
    let sql = `
      SELECT p.*, cpa.access_level, co.company_name as client_company_name, e.first_name as manager_first_name, e.last_name as manager_last_name
      FROM projects p
      JOIN client_project_access cpa ON p.id = cpa.project_id
      JOIN client_organizations co ON cpa.client_org_id = co.id
      LEFT JOIN employees e ON p.manager_id = e.id
    `;
    const params: any[] = [];
    if (clientOrgId) {
      sql += ` WHERE cpa.client_org_id = $1`;
      params.push(clientOrgId);
    }
    sql += ` ORDER BY p.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Deliverable Submissions & Approval Engine ────────────────────────────
  async createDeliverable(dto: CreateDeliverableDTO) {
    const res = await dbService.query(
      `INSERT INTO project_deliverables (project_id, title, description, due_date, version, status, approval_status)
       VALUES ($1, $2, $3, $4, $5, 'SUBMITTED', 'UNDER_REVIEW') RETURNING *`,
      [dto.project_id, dto.title, dto.description || null, dto.due_date || null, dto.version || 'v1.0']
    );
    return res.rows[0];
  }

  async getDeliverables(projectId?: number) {
    let sql = `
      SELECT pd.*, p.name as project_name, p.code as project_code
      FROM project_deliverables pd
      JOIN projects p ON pd.project_id = p.id
    `;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE pd.project_id = $1`;
      params.push(projectId);
    }
    sql += ` ORDER BY pd.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async reviewDeliverable(deliverableId: number, status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED', clientComments?: string, clientUserId?: number) {
    const res = await dbService.query(
      `UPDATE project_deliverables
       SET status = $1, approval_status = $1, client_comments = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, clientComments || null, clientUserId || null, deliverableId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES (1, 'DELIVERABLE_REVIEWED', 'CLIENT_PORTAL', $1)`,
      [`Client reviewed Deliverable #${deliverableId} as ${status}`]
    );

    return res.rows[0];
  }

  // ─── Change Request Workflow ──────────────────────────────────────────────
  async createChangeRequest(dto: CreateChangeRequestDTO, clientUserId?: number) {
    const res = await dbService.query(
      `INSERT INTO project_change_requests (
        project_id, client_user_id, title, description, reason, priority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED') RETURNING *`,
      [dto.project_id, clientUserId || null, dto.title, dto.description, dto.reason || null, dto.priority || 'MEDIUM']
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES (1, 'CHANGE_REQUEST_RAISED', 'CLIENT_PORTAL', $1)`,
      [`Change Request '${dto.title}' submitted for Project #${dto.project_id}`]
    );

    return res.rows[0];
  }

  async getChangeRequests(projectId?: number) {
    let sql = `
      SELECT pcr.*, p.name as project_name, p.code as project_code
      FROM project_change_requests pcr
      JOIN projects p ON pcr.project_id = p.id
    `;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE pcr.project_id = $1`;
      params.push(projectId);
    }
    sql += ` ORDER BY pcr.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }
}

export const clientPortalRepository = new ClientPortalRepository();
