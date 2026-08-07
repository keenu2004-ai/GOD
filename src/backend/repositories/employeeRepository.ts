import dbService from '../database/db.js';
import { Employee } from '../types/index.js';

export interface EmployeeQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
  branchId?: number;
  role?: string;
  status?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class EmployeeRepository {
  async findAll(options: EmployeeQueryOptions) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (!options.includeDeleted) {
      conditions.push(`e.is_deleted = false`);
    }

    if (options.search) {
      conditions.push(`(e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex} OR e.employee_code ILIKE $${paramIndex} OR e.designation ILIKE $${paramIndex})`);
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    if (options.departmentId) {
      conditions.push(`e.department_id = $${paramIndex}`);
      params.push(options.departmentId);
      paramIndex++;
    }

    if (options.branchId) {
      conditions.push(`e.branch_id = $${paramIndex}`);
      params.push(options.branchId);
      paramIndex++;
    }

    if (options.role) {
      conditions.push(`e.role = $${paramIndex}`);
      params.push(options.role);
      paramIndex++;
    }

    if (options.status) {
      conditions.push(`e.status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM employees e ${whereClause}`;
    const countRes = await dbService.query(countSql, params);
    const total = parseInt((countRes.rows[0] as any)?.total || '0', 10);

    const ALLOWED_SORT_COLUMNS: Record<string, string> = {
      id: 'e.id',
      first_name: 'e.first_name',
      last_name: 'e.last_name',
      email: 'e.email',
      employee_code: 'e.employee_code',
      joining_date: 'e.joining_date',
      salary: 'e.salary',
    };

    const sortColumn = (options.sortBy && ALLOWED_SORT_COLUMNS[options.sortBy])
      ? ALLOWED_SORT_COLUMNS[options.sortBy]
      : 'e.id';
    const sortDirection = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const querySql = `
      SELECT e.*, d.name as department_name, b.name as branch_name,
             m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN employees m ON e.reporting_manager_id = m.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const queryParams = [...params, limit, offset];
    const res = await dbService.query(querySql, queryParams);

    return {
      employees: res.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Employee | null> {
    const res = await dbService.query<Employee>(
      `SELECT e.*, d.name as department_name, b.name as branch_name,
              m.first_name as manager_first_name, m.last_name as manager_last_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN employees m ON e.reporting_manager_id = m.id
       WHERE e.id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByEmail(email: string, excludeId?: number): Promise<Employee | null> {
    let sql = `SELECT * FROM employees WHERE LOWER(email) = LOWER($1)`;
    const params: any[] = [email];
    if (excludeId) {
      sql += ` AND id != $2`;
      params.push(excludeId);
    }
    sql += ` LIMIT 1`;
    const res = await dbService.query<Employee>(sql, params);
    return res.rows[0] || null;
  }

  async findByCode(code: string, excludeId?: number): Promise<Employee | null> {
    let sql = `SELECT * FROM employees WHERE LOWER(employee_code) = LOWER($1)`;
    const params: any[] = [code];
    if (excludeId) {
      sql += ` AND id != $2`;
      params.push(excludeId);
    }
    sql += ` LIMIT 1`;
    const res = await dbService.query<Employee>(sql, params);
    return res.rows[0] || null;
  }

  async countTotal(): Promise<number> {
    const res = await dbService.query(`SELECT COUNT(*) as total FROM employees`);
    return parseInt((res.rows[0] as any)?.total || '0', 10);
  }

  async create(data: Partial<Employee> & { password_hash: string }): Promise<Employee> {
    const res = await dbService.query<Employee>(
      `INSERT INTO employees (
        employee_code, first_name, last_name, email, phone, password_hash, role,
        department_id, branch_id, designation, joining_date, salary,
        bank_account, ifsc_code, pan_number, aadhaar_number,
        emergency_contact_name, emergency_contact_phone, reporting_manager_id, avatar_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        data.employee_code,
        data.first_name,
        data.last_name,
        data.email,
        data.phone || '',
        data.password_hash,
        data.role || 'EMPLOYEE',
        data.department_id || 1,
        data.branch_id || 1,
        data.designation || 'Specialist',
        data.joining_date || new Date().toISOString().split('T')[0],
        data.salary || 50000.00,
        data.bank_account || '',
        data.ifsc_code || '',
        data.pan_number || '',
        data.aadhaar_number || '',
        data.emergency_contact_name || '',
        data.emergency_contact_phone || '',
        data.reporting_manager_id || null,
        data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        data.status || 'ACTIVE',
      ]
    );
    return res.rows[0];
  }

  async update(id: number, data: Partial<Employee>): Promise<Employee | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const updatableKeys: (keyof Employee)[] = [
      'first_name', 'last_name', 'email', 'phone', 'role', 'department_id',
      'branch_id', 'designation', 'joining_date', 'salary', 'bank_account',
      'ifsc_code', 'pan_number', 'aadhaar_number', 'emergency_contact_name',
      'emergency_contact_phone', 'reporting_manager_id', 'avatar_url', 'status'
    ];

    updatableKeys.forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        params.push(data[key]);
        idx++;
      }
    });

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await dbService.query<Employee>(sql, params);
    return res.rows[0] || null;
  }

  async softDelete(id: number): Promise<boolean> {
    await dbService.query('UPDATE employees SET is_deleted = true, status = $1 WHERE id = $2', ['INACTIVE', id]);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    await dbService.query('UPDATE employees SET is_deleted = false, status = $1 WHERE id = $2', ['ACTIVE', id]);
    return true;
  }

  async updateRole(id: number, role: string): Promise<boolean> {
    await dbService.query('UPDATE employees SET role = $1 WHERE id = $2', [role, id]);
    return true;
  }
}

export const employeeRepository = new EmployeeRepository();
