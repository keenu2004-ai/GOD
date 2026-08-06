import dbService from '../database/db.js';
import { Employee } from '../types/index.js';

export class AuthRepository {
  async findByEmail(email: string): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      'SELECT * FROM employees WHERE email = $1 AND is_deleted = false LIMIT 1',
      [email]
    );
    return res.rows[0] || null;
  }

  async findByCode(employeeCode: string): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      'SELECT * FROM employees WHERE employee_code = $1 AND is_deleted = false LIMIT 1',
      [employeeCode]
    );
    return res.rows[0] || null;
  }

  async findById(id: number): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      'SELECT * FROM employees WHERE id = $1 AND is_deleted = false LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  }
}

export const authRepository = new AuthRepository();
