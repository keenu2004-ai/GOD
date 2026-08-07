import dbService from '../database/db.js';

export interface ComponentMasterDTO {
  code: string;
  name: string;
  category: 'EARNING' | 'DEDUCTION' | 'REIMBURSEMENT' | 'BENEFIT' | 'TAX';
  calculation_mode: 'FLAT' | 'PERCENTAGE' | 'FORMULA';
  formula_expression?: string;
  min_value?: number;
  max_value?: number;
  is_taxable?: boolean;
}

export interface LoanRequestDTO {
  employee_id: number;
  loan_amount: number;
  interest_rate?: number;
  tenure_months: number;
  reason: string;
}

export interface AdvanceRequestDTO {
  employee_id: number;
  advance_amount: number;
  monthly_deduction: number;
  reason: string;
}

export interface BankDetailsDTO {
  employee_id: number;
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  branch_name?: string;
  payment_mode?: string;
}

export interface BenefitDTO {
  employee_id: number;
  benefit_name: string;
  benefit_type: 'HEALTH_INSURANCE' | 'LIFE_INSURANCE' | 'MEAL_CARD' | 'FUEL_CARD' | 'GYM';
  coverage_amount?: number;
  monthly_employer_cost?: number;
  monthly_employee_cost?: number;
}

export class SalaryComponentEngineRepository {

  // ─── Seed 25+ Standard Components ─────────────────────────────────────────
  async seedComponentMaster() {
    const components = [
      { code: 'BASIC', name: 'Basic Salary', category: 'EARNING', calculation_mode: 'PERCENTAGE', formula_expression: 'CTC * 0.50' },
      { code: 'HRA', name: 'House Rent Allowance (HRA)', category: 'EARNING', calculation_mode: 'FORMULA', formula_expression: 'BASIC * 0.40' },
      { code: 'SPECIAL_ALLOWANCE', name: 'Special Allowance', category: 'EARNING', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'CONVEYANCE', name: 'Conveyance Allowance', category: 'EARNING', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'MEDICAL_ALLOWANCE', name: 'Medical Allowance', category: 'EARNING', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'NIGHT_SHIFT', name: 'Night Shift Allowance', category: 'EARNING', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'PROJECT_ALLOWANCE', name: 'Project Bonus', category: 'EARNING', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'PERFORMANCE_BONUS', name: 'Performance Bonus', category: 'EARNING', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'PF_EMPLOYEE', name: 'Provident Fund (PF)', category: 'DEDUCTION', calculation_mode: 'FORMULA', formula_expression: 'MIN(BASIC * 0.12, 1800)' },
      { code: 'PT_DEDUCTION', name: 'Professional Tax (PT)', category: 'DEDUCTION', calculation_mode: 'FLAT', formula_expression: '200' },
      { code: 'ESI_EMPLOYEE', name: 'Employee State Insurance (ESI)', category: 'DEDUCTION', calculation_mode: 'FORMULA', formula_expression: 'GROSS * 0.0075' },
      { code: 'TDS_INCOME_TAX', name: 'TDS / Income Tax', category: 'TAX', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'LOAN_EMI', name: 'Loan EMI Deduction', category: 'DEDUCTION', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'ADVANCE_RECOVERY', name: 'Salary Advance Recovery', category: 'DEDUCTION', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'HEALTH_INSURANCE', name: 'Group Health Insurance', category: 'BENEFIT', calculation_mode: 'FLAT', formula_expression: '' },
      { code: 'MEAL_CARD', name: 'Sodexo / Meal Card', category: 'BENEFIT', calculation_mode: 'FLAT', formula_expression: '' },
    ];

    for (const c of components) {
      await dbService.query(
        `INSERT INTO salary_component_master (code, name, category, calculation_mode, formula_expression, is_taxable, is_active)
         VALUES ($1, $2, $3, $4, $5, true, true)
         ON CONFLICT (code) DO NOTHING`,
        [c.code, c.name, c.category, c.calculation_mode, c.formula_expression]
      );
    }
  }

  // ─── Component Master CRUD ───────────────────────────────────────────────
  async getComponentMaster() {
    const res = await dbService.query(`SELECT * FROM salary_component_master WHERE is_active = true ORDER BY category, name ASC`);
    return res.rows;
  }

  async createCustomComponent(dto: ComponentMasterDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO salary_component_master (
        code, name, category, calculation_mode, formula_expression, min_value, max_value, is_taxable, is_active, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $9) RETURNING *`,
      [
        dto.code.toUpperCase(), dto.name, dto.category, dto.calculation_mode || 'PERCENTAGE',
        dto.formula_expression || null, dto.min_value || 0, dto.max_value || null, dto.is_taxable ?? true, creatorId
      ]
    );

    await this._logAudit(creatorId, 'SALARY_COMPONENT_CREATED', `Created component: ${dto.name} (${dto.code})`);
    return res.rows[0];
  }

  // ─── Loan Management Engine ───────────────────────────────────────────────
  async requestLoan(dto: LoanRequestDTO) {
    const emi = Math.round((dto.loan_amount / dto.tenure_months) * 100) / 100;
    const res = await dbService.query(
      `INSERT INTO employee_loans (
        employee_id, loan_amount, interest_rate, tenure_months, emi_amount, total_repaid, outstanding_balance, reason, status
      ) VALUES ($1, $2, $3, $4, $5, 0, $2, $6, 'PENDING') RETURNING *`,
      [dto.employee_id, dto.loan_amount, dto.interest_rate || 0, dto.tenure_months, emi, dto.reason]
    );
    await this._logAudit(dto.employee_id, 'LOAN_REQUESTED', `Requested loan of ₹${dto.loan_amount} for ${dto.tenure_months} months`);
    return res.rows[0];
  }

  async approveLoan(loanId: number, approverId: number) {
    const res = await dbService.query(
      `UPDATE employee_loans
       SET status = 'APPROVED', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [approverId, loanId]
    );
    await this._logAudit(approverId, 'LOAN_APPROVED', `Approved loan #${loanId}`);
    return res.rows[0];
  }

  async getLoans(employeeId?: number) {
    let sql = `
      SELECT el.*, e.first_name, e.last_name, e.employee_code,
        app.first_name as approver_first, app.last_name as approver_last
      FROM employee_loans el
      JOIN employees e ON el.employee_id = e.id
      LEFT JOIN employees app ON el.approved_by = app.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE el.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY el.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Salary Advance Engine ────────────────────────────────────────────────
  async requestAdvance(dto: AdvanceRequestDTO) {
    const res = await dbService.query(
      `INSERT INTO employee_salary_advances (
        employee_id, advance_amount, monthly_deduction, total_recovered, outstanding_balance, reason, status
      ) VALUES ($1, $2, $3, 0, $2, $4, 'PENDING') RETURNING *`,
      [dto.employee_id, dto.advance_amount, dto.monthly_deduction, dto.reason]
    );
    await this._logAudit(dto.employee_id, 'SALARY_ADVANCE_REQUESTED', `Requested salary advance of ₹${dto.advance_amount}`);
    return res.rows[0];
  }

  async approveAdvance(advanceId: number, approverId: number) {
    const res = await dbService.query(
      `UPDATE employee_salary_advances
       SET status = 'APPROVED', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [approverId, advanceId]
    );
    await this._logAudit(approverId, 'SALARY_ADVANCE_APPROVED', `Approved salary advance #${advanceId}`);
    return res.rows[0];
  }

  async getAdvances(employeeId?: number) {
    let sql = `
      SELECT esa.*, e.first_name, e.last_name, e.employee_code
      FROM employee_salary_advances esa
      JOIN employees e ON esa.employee_id = e.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE esa.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY esa.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Employee Bank Details ────────────────────────────────────────────────
  async saveBankDetails(dto: BankDetailsDTO, updaterId: number) {
    const res = await dbService.query(
      `INSERT INTO employee_bank_details (
        employee_id, account_holder_name, account_number, bank_name, ifsc_code, branch_name, payment_mode, is_verified, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      ON CONFLICT (employee_id) DO UPDATE SET
        account_holder_name = EXCLUDED.account_holder_name,
        account_number = EXCLUDED.account_number,
        bank_name = EXCLUDED.bank_name,
        ifsc_code = EXCLUDED.ifsc_code,
        branch_name = EXCLUDED.branch_name,
        payment_mode = EXCLUDED.payment_mode,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [dto.employee_id, dto.account_holder_name, dto.account_number, dto.bank_name, dto.ifsc_code, dto.branch_name || null, dto.payment_mode || 'BANK_TRANSFER', updaterId]
    );
    await this._logAudit(updaterId, 'BANK_DETAILS_UPDATED', `Updated bank account details for Employee #${dto.employee_id}`);
    return res.rows[0];
  }

  async getBankDetails(employeeId: number) {
    const res = await dbService.query(
      `SELECT ebd.*, e.first_name, e.last_name, e.employee_code
       FROM employee_bank_details ebd
       JOIN employees e ON ebd.employee_id = e.id
       WHERE ebd.employee_id = $1`,
      [employeeId]
    );
    return res.rows[0] || null;
  }

  async getAllBankDetails() {
    const res = await dbService.query(
      `SELECT ebd.*, e.first_name, e.last_name, e.employee_code
       FROM employee_bank_details ebd
       JOIN employees e ON ebd.employee_id = e.id
       ORDER BY e.first_name ASC`
    );
    return res.rows;
  }

  // ─── Employee Benefits Repository ─────────────────────────────────────────
  async assignBenefit(dto: BenefitDTO) {
    const res = await dbService.query(
      `INSERT INTO employee_benefits (
        employee_id, benefit_name, benefit_type, coverage_amount, monthly_employer_cost, monthly_employee_cost, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING *`,
      [dto.employee_id, dto.benefit_name, dto.benefit_type, dto.coverage_amount || 0, dto.monthly_employer_cost || 0, dto.monthly_employee_cost || 0]
    );
    await this._logAudit(dto.employee_id, 'BENEFIT_ASSIGNED', `Assigned benefit: ${dto.benefit_name}`);
    return res.rows[0];
  }

  async getBenefits(employeeId?: number) {
    let sql = `
      SELECT eb.*, e.first_name, e.last_name, e.employee_code
      FROM employee_benefits eb
      JOIN employees e ON eb.employee_id = e.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE eb.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY eb.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  private async _logAudit(actorId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, $2, 'SALARY_COMPONENT_ENGINE', $3)`,
        [actorId, action, details]
      );
    } catch { /* non-fatal */ }
  }
}

export const salaryComponentEngineRepository = new SalaryComponentEngineRepository();
