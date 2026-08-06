import dbService from '../database/db.js';
import { PayrollRecord } from '../types/index.js';

export class PayrollRepository {
  async getAllPayrolls(month?: string, year?: number, employeeId?: number) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (month) {
      conditions.push(`p.month = $${idx}`);
      params.push(month);
      idx++;
    }

    if (year) {
      conditions.push(`p.year = $${idx}`);
      params.push(year);
      idx++;
    }

    if (employeeId) {
      conditions.push(`p.employee_id = $${idx}`);
      params.push(employeeId);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, e.designation, e.bank_account, e.ifsc_code, e.pan_number,
             d.name as department_name, b.name as branch_name
      FROM payrolls p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      ${whereClause}
      ORDER BY p.year DESC, p.id DESC
    `;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async getById(id: number) {
    const sql = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, e.designation, e.email, e.phone, e.bank_account, e.ifsc_code, e.pan_number, e.aadhaar_number,
             d.name as department_name, b.name as branch_name, b.address as branch_address
      FROM payrolls p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE p.id = $1 LIMIT 1
    `;
    const res = await dbService.query(sql, [id]);
    return res.rows[0] || null;
  }

  async generatePayrollForEmployee(employeeId: number, month: string, year: number, basicSalary: number): Promise<PayrollRecord> {
    const hra = basicSalary * 0.50;
    const conveyance = 10000;
    const allowances = basicSalary * 0.15;
    const grossSalary = basicSalary + hra + conveyance + allowances;
    const pfDeduction = Math.min(basicSalary * 0.12, 1800);
    const esiDeduction = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
    const tdsDeduction = grossSalary > 100000 ? grossSalary * 0.10 : grossSalary * 0.05;
    const netSalary = grossSalary - pfDeduction - esiDeduction - tdsDeduction;

    const res = await dbService.query<PayrollRecord>(
      `INSERT INTO payrolls (
        employee_id, month, year, basic_salary, hra, conveyance, allowances,
        gross_salary, pf_deduction, esi_deduction, tds_deduction, net_salary, payment_status, payment_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PAID', CURRENT_DATE)
      RETURNING *`,
      [employeeId, month, year, basicSalary, hra, conveyance, allowances, grossSalary, pfDeduction, esiDeduction, tdsDeduction, netSalary]
    );
    return res.rows[0];
  }
}

export const payrollRepository = new PayrollRepository();
