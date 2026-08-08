import dbService from '../database/db.js';

export interface CreateBranchDTO {
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  is_headquarters?: boolean;
}

export class OrganizationRepository {

  // ─── Branch Management ───────────────────────────────────────────────────
  async createBranch(dto: CreateBranchDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO branches (name, code, city, state, address, is_headquarters)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [dto.name, dto.code, dto.city, dto.state, dto.address, dto.is_headquarters || false]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'BRANCH_CREATED', 'ORGANIZATION', $2)`,
      [creatorId, `Created Branch ${dto.name} (${dto.code})`]
    );

    return res.rows[0];
  }

  async getBranches() {
    const res = await dbService.query(
      `SELECT b.*, COUNT(e.id) as employee_count
       FROM branches b
       LEFT JOIN employees e ON e.branch_id = b.id
       GROUP BY b.id
       ORDER BY b.is_headquarters DESC, b.name ASC`
    );
    return res.rows;
  }

  // ─── Employee Branch Transfer ─────────────────────────────────────────────
  async transferEmployeeBranch(employeeId: number, toBranchId: number, reason: string, transferredBy: number) {
    const empRes = await dbService.query(`SELECT branch_id FROM employees WHERE id = $1`, [employeeId]);
    const fromBranchId = empRes.rows[0]?.branch_id || null;

    await dbService.query(
      `UPDATE employees SET branch_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [toBranchId, employeeId]
    );

    const res = await dbService.query(
      `INSERT INTO employee_branch_transfers (employee_id, from_branch_id, to_branch_id, reason, transferred_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employeeId, fromBranchId, toBranchId, reason, transferredBy]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'EMPLOYEE_BRANCH_TRANSFERRED', 'ORGANIZATION', $2)`,
      [transferredBy, `Transferred Employee #${employeeId} to Branch #${toBranchId}: ${reason}`]
    );

    return res.rows[0];
  }

  // ─── RBAC Role & Permission Matrix ────────────────────────────────────────
  async getRoles() {
    const res = await dbService.query(`SELECT * FROM roles ORDER BY id ASC`);
    if (res.rows.length === 0) {
      // Seed System Roles if empty
      await dbService.query(`
        INSERT INTO roles (role_name, display_name, description) VALUES
        ('SUPER_ADMIN', 'Super Administrator', 'Full Unrestricted System Control'),
        ('COMPANY_ADMIN', 'Company Administrator', 'Organization Wide HR & Operations Control'),
        ('HR_MANAGER', 'HR Manager', 'Employee Management & Leave Control'),
        ('FINANCE_MANAGER', 'Finance Manager', 'Payroll & Expenses Control'),
        ('ASSET_MANAGER', 'Asset Manager', 'Inventory & IT Maintenance Control'),
        ('EMPLOYEE', 'Standard Employee', 'Personal Self-Service Portal Access')
        ON CONFLICT DO NOTHING
      `);
      const seeded = await dbService.query(`SELECT * FROM roles ORDER BY id ASC`);
      return seeded.rows;
    }
    return res.rows;
  }

  async getRolePermissions(roleId: number) {
    const res = await dbService.query(
      `SELECT rp.*, p.permission_code, p.category, p.description
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    return res.rows;
  }

  // ─── Organization Hierarchy Tree ──────────────────────────────────────────
  async getOrganizationHierarchy() {
    const brRes = await dbService.query(`SELECT * FROM branches ORDER BY is_headquarters DESC, name ASC`);
    const deptRes = await dbService.query(`SELECT * FROM departments ORDER BY name ASC`);
    const empRes = await dbService.query(`SELECT id, first_name, last_name, designation, branch_id, department_id FROM employees`);

    return {
      branches: brRes.rows,
      departments: deptRes.rows,
      employees: empRes.rows,
    };
  }
}

export const organizationRepository = new OrganizationRepository();
