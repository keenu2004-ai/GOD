import dbService from '../database/db.js';

export interface AssignSalaryDTO {
  employee_id: number;
  template_id?: number;
  annual_ctc: number;
  effective_date: string;
}

export interface SalaryTemplateDTO {
  name: string;
  description?: string;
  annual_ctc: number;
  employment_type?: string;
  branch_id?: number;
  department_id?: number;
}

export interface SalaryRevisionDTO {
  employee_id: number;
  new_ctc: number;
  revision_type: 'ANNUAL_INCREMENT' | 'PROMOTION' | 'MARKET_CORRECTION' | 'TRANSFER' | 'MANUAL';
  effective_date: string;
  reason: string;
}

export class PayrollFoundationRepository {

  // ─── Seed Default Salary Components ─────────────────────────────────────
  async seedDefaultComponents() {
    const components = [
      { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', default_value: 50.0, is_taxable: true },
      { code: 'HRA', name: 'House Rent Allowance', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_BASIC', default_value: 40.0, is_taxable: true },
      { code: 'SPECIAL_ALLOWANCE', name: 'Special Allowance', type: 'EARNING', calculation_type: 'FLAT', default_value: 0, is_taxable: true },
      { code: 'PF_EMPLOYEE', name: 'Provident Fund (PF)', type: 'DEDUCTION', calculation_type: 'PERCENTAGE_OF_BASIC', default_value: 12.0, is_taxable: false },
      { code: 'PT_DEDUCTION', name: 'Professional Tax (PT)', type: 'DEDUCTION', calculation_type: 'FLAT', default_value: 200.0, is_taxable: false },
      { code: 'ESI_EMPLOYEE', name: 'Employee State Insurance (ESI)', type: 'DEDUCTION', calculation_type: 'PERCENTAGE_OF_BASIC', default_value: 0.75, is_taxable: false },
    ];

    for (const c of components) {
      await dbService.query(
        `INSERT INTO salary_components (code, name, type, calculation_type, default_value, is_taxable, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (code) DO NOTHING`,
        [c.code, c.name, c.type, c.calculation_type, c.default_value, c.is_taxable]
      );
    }
  }

  // ─── Salary Structure Calculation Helper ──────────────────────────────────
  calculateSalaryBreakdown(annualCtc: number) {
    const monthlyGross = Math.round((annualCtc / 12) * 100) / 100;
    const basic = Math.round((monthlyGross * 0.50) * 100) / 100;
    const hra = Math.round((basic * 0.40) * 100) / 100;
    const specialAllowance = Math.max(0, Math.round((monthlyGross - (basic + hra)) * 100) / 100);

    const pfDeduction = Math.min(Math.round((basic * 0.12) * 100) / 100, 1800);
    const ptDeduction = monthlyGross > 15000 ? 200 : 0;
    const esiDeduction = monthlyGross <= 21000 ? Math.round((monthlyGross * 0.0075) * 100) / 100 : 0;

    const totalDeductions = pfDeduction + ptDeduction + esiDeduction;
    const monthlyNet = Math.round((monthlyGross - totalDeductions) * 100) / 100;

    return {
      annual_ctc: annualCtc,
      monthly_gross: monthlyGross,
      monthly_net: monthlyNet,
      basic_salary: basic,
      hra: hra,
      special_allowance: specialAllowance,
      pf_deduction: pfDeduction,
      esi_deduction: esiDeduction,
      pt_deduction: ptDeduction,
      tds_deduction: 0,
    };
  }

  // ─── Salary Assignment Engine ──────────────────────────────────────────────
  async assignSalaryStructure(dto: AssignSalaryDTO, creatorId: number) {
    const calc = this.calculateSalaryBreakdown(dto.annual_ctc);

    const res = await dbService.query(
      `INSERT INTO employee_salary_assignments (
        employee_id, template_id, annual_ctc, monthly_gross, monthly_net,
        basic_salary, hra, special_allowance, pf_deduction, esi_deduction, pt_deduction,
        effective_date, is_active, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $13)
      ON CONFLICT (employee_id) DO UPDATE SET
        template_id = EXCLUDED.template_id,
        annual_ctc = EXCLUDED.annual_ctc,
        monthly_gross = EXCLUDED.monthly_gross,
        monthly_net = EXCLUDED.monthly_net,
        basic_salary = EXCLUDED.basic_salary,
        hra = EXCLUDED.hra,
        special_allowance = EXCLUDED.special_allowance,
        pf_deduction = EXCLUDED.pf_deduction,
        esi_deduction = EXCLUDED.esi_deduction,
        pt_deduction = EXCLUDED.pt_deduction,
        effective_date = EXCLUDED.effective_date,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        dto.employee_id, dto.template_id || null, calc.annual_ctc, calc.monthly_gross, calc.monthly_net,
        calc.basic_salary, calc.hra, calc.special_allowance, calc.pf_deduction, calc.esi_deduction, calc.pt_deduction,
        dto.effective_date, creatorId
      ]
    );

    await this._logAudit(creatorId, 'SALARY_ASSIGNED', `Assigned CTC ₹${dto.annual_ctc} to Employee #${dto.employee_id}`);
    return res.rows[0];
  }

  async getAllSalaryAssignments() {
    const res = await dbService.query(
      `SELECT esa.*, e.first_name, e.last_name, e.employee_code, d.name as department_name, b.name as branch_name
       FROM employee_salary_assignments esa
       JOIN employees e ON esa.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE esa.is_active = true AND e.is_deleted = false
       ORDER BY e.first_name ASC`
    );
    return res.rows;
  }

  async getEmployeeSalaryAssignment(employeeId: number) {
    const res = await dbService.query(
      `SELECT esa.*, e.first_name, e.last_name, e.employee_code, e.joining_date, d.name as department_name
       FROM employee_salary_assignments esa
       JOIN employees e ON esa.employee_id = e.id
       WHERE esa.employee_id = $1 AND esa.is_active = true`,
      [employeeId]
    );
    return res.rows[0] || null;
  }

  // ─── Salary Templates CRUD ───────────────────────────────────────────────
  async getSalaryTemplates() {
    const res = await dbService.query(
      `SELECT st.*, b.name as branch_name, d.name as department_name
       FROM salary_templates st
       LEFT JOIN branches b ON st.branch_id = b.id
       LEFT JOIN departments d ON st.department_id = d.id
       WHERE st.is_active = true ORDER BY st.name ASC`
    );
    return res.rows;
  }

  async createSalaryTemplate(dto: SalaryTemplateDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO salary_templates (name, description, annual_ctc, employment_type, branch_id, department_id, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *`,
      [dto.name, dto.description || null, dto.annual_ctc, dto.employment_type || 'PERMANENT', dto.branch_id || null, dto.department_id || null, creatorId]
    );
    await this._logAudit(creatorId, 'SALARY_TEMPLATE_CREATED', `Created template: ${dto.name}`);
    return res.rows[0];
  }

  // ─── Salary Revision Workflow ─────────────────────────────────────────────
  async requestSalaryRevision(dto: SalaryRevisionDTO, creatorId: number) {
    const current = await this.getEmployeeSalaryAssignment(dto.employee_id);
    const oldCtc = current ? parseFloat(current.annual_ctc) : 0;

    const res = await dbService.query(
      `INSERT INTO salary_revisions (employee_id, old_ctc, new_ctc, revision_type, effective_date, reason, status, approved_by, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', $7, $7) RETURNING *`,
      [dto.employee_id, oldCtc, dto.new_ctc, dto.revision_type, dto.effective_date, dto.reason, creatorId]
    );

    // Apply the revision immediately
    await this.assignSalaryStructure({
      employee_id: dto.employee_id,
      annual_ctc: dto.new_ctc,
      effective_date: dto.effective_date,
    }, creatorId);

    await this._logAudit(creatorId, 'SALARY_REVISED', `Revised salary for Emp #${dto.employee_id} from ₹${oldCtc} to ₹${dto.new_ctc}`);
    return res.rows[0];
  }

  async getSalaryRevisions(employeeId?: number) {
    let sql = `
      SELECT sr.*, e.first_name, e.last_name, e.employee_code,
        app.first_name as approver_first, app.last_name as approver_last
      FROM salary_revisions sr
      JOIN employees e ON sr.employee_id = e.id
      LEFT JOIN employees app ON sr.approved_by = app.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE sr.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY sr.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Payroll Settings ───────────────────────────────────────────────────
  async getPayrollSettings() {
    const res = await dbService.query(`SELECT * FROM payroll_settings ORDER BY id DESC LIMIT 1`);
    if (res.rows.length === 0) {
      const init = await dbService.query(
        `INSERT INTO payroll_settings (payroll_cycle, cutoff_day, pay_day, working_days_month, pf_rate, esi_rate, pt_amount)
         VALUES ('MONTHLY', 25, 1, 22, 12.00, 0.75, 200.00) RETURNING *`
      );
      return init.rows[0];
    }
    return res.rows[0];
  }

  async updatePayrollSettings(data: any, updaterId: number) {
    const res = await dbService.query(
      `UPDATE payroll_settings
       SET payroll_cycle = $1, cutoff_day = $2, pay_day = $3, working_days_month = $4,
           pf_rate = $5, esi_rate = $6, pt_amount = $7, updated_by = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM payroll_settings LIMIT 1) RETURNING *`,
      [
        data.payroll_cycle || 'MONTHLY', data.cutoff_day || 25, data.pay_day || 1, data.working_days_month || 22,
        data.pf_rate || 12.00, data.esi_rate || 0.75, data.pt_amount || 200.00, updaterId
      ]
    );
    await this._logAudit(updaterId, 'PAYROLL_SETTINGS_UPDATED', `Updated payroll cycle and statutory rates`);
    return res.rows[0];
  }

  // ─── Compensation Dashboard Aggregation ─────────────────────────────────
  async getCompensationDashboardKPIs() {
    const res = await dbService.query(
      `SELECT
        COUNT(*) as assigned_employees,
        SUM(annual_ctc) as total_annual_ctc,
        SUM(monthly_gross) as total_monthly_gross,
        SUM(monthly_net) as total_monthly_net,
        SUM(pf_deduction) as total_pf_liability,
        SUM(esi_deduction) as total_esi_liability,
        SUM(pt_deduction) as total_pt_liability
       FROM employee_salary_assignments
       WHERE is_active = true`
    );
    const r = res.rows[0] || {};
    return {
      assigned_employees: parseInt(r.assigned_employees || '0', 10),
      total_annual_ctc: parseFloat(r.total_annual_ctc || '0'),
      total_monthly_gross: parseFloat(r.total_monthly_gross || '0'),
      total_monthly_net: parseFloat(r.total_monthly_net || '0'),
      total_pf_liability: parseFloat(r.total_pf_liability || '0'),
      total_esi_liability: parseFloat(r.total_esi_liability || '0'),
      total_pt_liability: parseFloat(r.total_pt_liability || '0'),
    };
  }

  private async _logAudit(actorId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, $2, 'PAYROLL_FOUNDATION', $3)`,
        [actorId, action, details]
      );
    } catch { /* non-fatal */ }
  }
}

export const payrollFoundationRepository = new PayrollFoundationRepository();
