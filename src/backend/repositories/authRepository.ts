import dbService from '../database/db.js';
import { Employee } from '../types/index.js';

export class AuthRepository {
  async findByEmail(email: string): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      'SELECT * FROM employees WHERE LOWER(email) = LOWER($1) AND is_deleted = false LIMIT 1',
      [email]
    );
    return res.rows[0] || null;
  }

  async findByCode(employeeCode: string): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      'SELECT * FROM employees WHERE UPPER(employee_code) = UPPER($1) AND is_deleted = false LIMIT 1',
      [employeeCode]
    );
    return res.rows[0] || null;
  }

  async findByIdentifier(identifier: string): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      `SELECT * FROM employees 
       WHERE (LOWER(email) = LOWER($1) OR UPPER(employee_code) = UPPER($1)) 
         AND (is_deleted = false OR is_deleted IS NULL) 
       LIMIT 1`,
      [identifier]
    );
    return res.rows[0] || null;
  }

  async findById(id: number): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      'SELECT * FROM employees WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL) LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  }

  async updatePassword(employeeId: number, passwordHash: string): Promise<boolean> {
    await dbService.query(
      'UPDATE employees SET password_hash = $1 WHERE id = $2',
      [passwordHash, employeeId]
    );
    return true;
  }

  async logLoginHistory(employeeId: number, ip: string, userAgent: string, status: string, failureReason?: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details, ip_address)
         VALUES ($1, $2, 'AUTHENTICATION', $3, $4)`,
        [employeeId, status === 'SUCCESS' ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', failureReason || `Login from ${userAgent}`, ip]
      );
    } catch (e) {
      console.warn('[Auth Log Warning] Could not record login history:', e);
    }
  }

  async getLoginHistory(employeeId: number, limit = 10) {
    try {
      const res = await dbService.query(
        `SELECT id, action, details, ip_address, created_at
         FROM audit_logs
         WHERE employee_id = $1 AND module = 'AUTHENTICATION'
         ORDER BY id DESC LIMIT $2`,
        [employeeId, limit]
      );
      return res.rows;
    } catch (e) {
      return [];
    }
  }

  async getAllRolesAndPermissions() {
    try {
      const rolesRes = await dbService.query('SELECT * FROM roles ORDER BY id ASC');
      const permsRes = await dbService.query('SELECT * FROM permissions ORDER BY id ASC');
      const rolePermsRes = await dbService.query('SELECT * FROM role_permissions');
      return {
        roles: rolesRes.rows,
        permissions: permsRes.rows,
        role_permissions: rolePermsRes.rows,
      };
    } catch (e) {
      return { roles: [], permissions: [], role_permissions: [] };
    }
  }

  async updateRolePermissions(role: string, permissionCodes: string[]) {
    try {
      await dbService.query('DELETE FROM role_permissions WHERE role = $1', [role]);
      for (const code of permissionCodes) {
        await dbService.query(
          'INSERT INTO role_permissions (role, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [role, code]
        );
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const authRepository = new AuthRepository();
