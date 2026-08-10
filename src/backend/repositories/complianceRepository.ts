import dbService from '../database/db.js';

export class ComplianceRepository {
  // ─── 1. PF ECR (Electronic Challan Return) Generator ───────────────────────
  async generatePFECR(month: string, year: number, organizationId?: number) {
    let sql = `
      SELECT e.employee_code, e.first_name, e.last_name, e.salary,
             p.basic_salary, p.pf_deduction, p.gross_salary
      FROM payroll_run_items p
      JOIN employees e ON p.employee_id = e.id
      JOIN payroll_runs pr ON p.run_id = pr.id
      WHERE pr.month = $1 AND pr.year = $2
    `;
    const params: any[] = [month, year];
    if (organizationId) {
      sql += ` AND pr.organization_id = $3`;
      params.push(organizationId);
    }

    const res = await dbService.query(sql, params);
    const rows = res.rows;

    let ecrText = `# UAN # MEMBER_NAME # GROSS_WAGES # EPF_WAGES # EPS_WAGES # EDLI_WAGES # EE_SHARE # EPS_SHARE # ER_SHARE # NCP_DAYS\n`;

    rows.forEach((r, idx) => {
      const uan = `101${String(r.employee_code).padStart(9, '0')}`;
      const name = `${r.first_name} ${r.last_name}`.toUpperCase();
      const gross = Math.round(Number(r.gross_salary || r.salary || 50000));
      const basic = Math.round(Number(r.basic_salary || gross * 0.5));
      const epfWages = Math.min(basic, 15000);
      const eeShare = Math.round(epfWages * 0.12);
      const epsShare = Math.round(epfWages * 0.0833);
      const erShare = eeShare - epsShare;

      ecrText += `${uan}#~#${name}#~#${gross}#~#${epfWages}#~#${epfWages}#~#${epfWages}#~#${eeShare}#~#${epsShare}#~#${erShare}#~#0\n`;
    });

    return {
      month,
      year,
      total_employees: rows.length,
      ecr_file_content: ecrText,
    };
  }

  // ─── 2. ESIC Return Generator ──────────────────────────────────────────────
  async generateESICReturn(month: string, year: number, organizationId?: number) {
    let sql = `
      SELECT e.employee_code, e.first_name, e.last_name, e.salary,
             p.gross_salary, p.esi_deduction
      FROM payroll_run_items p
      JOIN employees e ON p.employee_id = e.id
      JOIN payroll_runs pr ON p.run_id = pr.id
      WHERE pr.month = $1 AND pr.year = $2
    `;
    const params: any[] = [month, year];
    if (organizationId) {
      sql += ` AND pr.organization_id = $3`;
      params.push(organizationId);
    }

    const res = await dbService.query(sql, params);
    const rows = res.rows;

    const records = rows.map((r) => {
      const gross = Math.round(Number(r.gross_salary || r.salary || 21000));
      const eeContrib = Math.round(gross * 0.0075);
      const erContrib = Math.round(gross * 0.0325);
      return {
        ip_number: `31${String(r.employee_code).padStart(8, '0')}`,
        ip_name: `${r.first_name} ${r.last_name}`.toUpperCase(),
        worked_days: 26,
        monthly_wages: gross,
        employee_contribution: eeContrib,
        employer_contribution: erContrib,
        total_contribution: eeContrib + erContrib,
      };
    });

    return {
      month,
      year,
      total_covered: records.length,
      records,
    };
  }

  // ─── 3. Form 16 Tax Estimation Statement ──────────────────────────────────
  async getForm16Estimate(employeeId: number, financialYear: string = '2025-2026') {
    const empRes = await dbService.query(
      `SELECT e.*, d.name as department_name, b.name as branch_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE e.id = $1 LIMIT 1`,
      [employeeId]
    );

    const emp = empRes.rows[0];
    if (!emp) throw new Error('Employee not found');

    const grossAnnualSalary = Number(emp.salary || 600000) * 12;
    const standardDeduction = 75000; // New Tax Regime 2025-26
    const taxableIncome = Math.max(0, grossAnnualSalary - standardDeduction);

    // New Tax Slab Calculation
    let taxLiability = 0;
    if (taxableIncome > 1200000) {
      taxLiability = (taxableIncome - 1200000) * 0.20 + 60000;
    } else if (taxableIncome > 800000) {
      taxLiability = (taxableIncome - 800000) * 0.15 + 20000;
    } else if (taxableIncome > 400000) {
      taxLiability = (taxableIncome - 400000) * 0.10;
    }

    const cess = Math.round(taxLiability * 0.04);
    const totalTaxPayable = Math.round(taxLiability + cess);

    return {
      financial_year: financialYear,
      employee: {
        id: emp.id,
        employee_code: emp.employee_code,
        name: `${emp.first_name} ${emp.last_name}`,
        pan_number: emp.pan_number || 'ABCDE1234F',
        designation: emp.designation,
        department: emp.department_name,
      },
      part_a: {
        employer_name: 'Theiakshi Enterprises Pvt. Ltd.',
        employer_tan: 'MUMB12345A',
        quarterly_tds: [
          { quarter: 'Q1', amount_deposited: Math.round(totalTaxPayable / 4) },
          { quarter: 'Q2', amount_deposited: Math.round(totalTaxPayable / 4) },
          { quarter: 'Q3', amount_deposited: Math.round(totalTaxPayable / 4) },
          { quarter: 'Q4', amount_deposited: Math.round(totalTaxPayable / 4) },
        ],
      },
      part_b: {
        gross_annual_salary: grossAnnualSalary,
        standard_deduction: standardDeduction,
        taxable_income: taxableIncome,
        tax_regime: 'NEW_TAX_REGIME_FY2526',
        tax_liability: taxLiability,
        health_education_cess: cess,
        total_tax_payable: totalTaxPayable,
      },
    };
  }
}

export const complianceRepository = new ComplianceRepository();
