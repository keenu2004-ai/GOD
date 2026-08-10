import dbService from '../database/db.js';
import bcrypt from 'bcryptjs';

export interface CreateEmployeeDTO {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation: string;
  department_id?: number;
  branch_id?: number;
  reporting_manager_id?: number;
  joining_date: string;
  role?: string;
  organization_id?: number;
}

export class EmployeeManagementRepository {

  // ─── Employee Creation & Onboarding Engine ─────────────────────────────────
  async createEmployee(dto: CreateEmployeeDTO, creatorId: number) {
    return await dbService.transaction(async (client) => {
      const num = Math.floor(100000 + Math.random() * 900000);
      const empCode = `EMP-2026-${num}`;
      const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

      const empRes = await client.query(
        `INSERT INTO employees (employee_code, first_name, last_name, email, phone, password_hash, role, designation, joining_date, department_id, branch_id, reporting_manager_id, status, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE', $13) RETURNING *`,
        [
          empCode, dto.first_name, dto.last_name, dto.email, dto.phone, defaultPasswordHash,
          dto.role || 'EMPLOYEE', dto.designation, dto.joining_date,
          dto.department_id || null, dto.branch_id || null, dto.reporting_manager_id || null,
          dto.organization_id || 1
        ]
      );

      const emp = empRes.rows[0];

      // Seed Onboarding Checklist
      const steps = ['Personal Information Review', 'Bank Account & Statutory Declarations', 'IT Asset Allocation & Credentials', 'Company Policy & HR Handbook Acknowledgment'];
      for (const step of steps) {
        await client.query(
          `INSERT INTO employee_onboarding_checklists (employee_id, step_name, is_completed) VALUES ($1, $2, false)`,
          [emp.id, step]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'EMPLOYEE_CREATED', 'EMPLOYEE_MANAGEMENT', $2)`,
        [creatorId, `Created Employee ${dto.first_name} ${dto.last_name} (${empCode})`]
      );

      return emp;
    });
  }

  async getEmployees(organizationId?: number) {
    let sql = `SELECT e.*, d.name as department_name, b.name as branch_name, m.first_name as mgr_first, m.last_name as mgr_last
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN employees m ON e.reporting_manager_id = m.id
       WHERE e.is_deleted = false`;
    const params: any[] = [];
    if (organizationId) {
      sql += ` AND e.organization_id = $1`;
      params.push(organizationId);
    }
    sql += ` ORDER BY e.created_at DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Visual Organization Chart Tree Engine ─────────────────────────────────
  async getOrgChartTree(organizationId?: number) {
    let sql = `SELECT e.id, e.first_name, e.last_name, e.designation, e.reporting_manager_id, e.avatar_url,
              d.name as department_name, b.name as branch_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE e.is_deleted = false AND e.status = 'ACTIVE'`;
    const params: any[] = [];
    if (organizationId) {
      sql += ` AND e.organization_id = $1`;
      params.push(organizationId);
    }
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── IDOR Secure Employee Profile & Documents ──────────────────────────────
  async getEmployeeProfile(employeeId: number, requesterId: number, requesterRole: string, requesterOrgId?: number) {
    const empRes = await dbService.query(`SELECT * FROM employees WHERE id = $1`, [employeeId]);
    const emp = empRes.rows[0];
    if (!emp) {
      throw new Error('Employee profile not found');
    }

    if (requesterOrgId && emp.organization_id !== requesterOrgId) {
      throw new Error('Unauthorized: You cannot access profiles from another organization');
    }

    const isAuthorized = requesterId === employeeId || ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(requesterRole);
    if (!isAuthorized) {
      throw new Error('Unauthorized: You can only view your own profile details');
    }

    const docRes = await dbService.query(`SELECT * FROM employee_documents WHERE employee_id = $1`, [employeeId]);
    const chkRes = await dbService.query(`SELECT * FROM employee_onboarding_checklists WHERE employee_id = $1`, [employeeId]);
    const eduRes = await dbService.query(`SELECT * FROM education WHERE employee_id = $1 ORDER BY start_date DESC`, [employeeId]);
    const expRes = await dbService.query(`SELECT * FROM experience WHERE employee_id = $1 ORDER BY start_date DESC`, [employeeId]);

    return {
      employee: emp,
      documents: docRes.rows,
      onboarding: chkRes.rows,
      education: eduRes.rows,
      experience: expRes.rows,
    };
  }
}

export const employeeManagementRepository = new EmployeeManagementRepository();
