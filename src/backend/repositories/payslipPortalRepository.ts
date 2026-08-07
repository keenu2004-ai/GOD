import dbService from '../database/db.js';

export interface CertificateRequestDTO {
  employee_id: number;
  certificate_type: 'SALARY_CERTIFICATE' | 'EMPLOYMENT_LETTER' | 'COMPENSATION_LETTER' | 'INCREMENT_LETTER';
  purpose: string;
}

export class PayslipPortalRepository {

  // ─── Automated Digital Payslip Generator ──────────────────────────────────
  async getEmployeePayslipDetails(employeeId: number, month: string, year: number, creatorId = 1) {
    // 1. Fetch Payroll Run Item
    const itemRes = await dbService.query(
      `SELECT pri.*, pr.month, pr.year, pr.status as run_status
       FROM payroll_run_items pri
       JOIN payroll_runs pr ON pri.run_id = pr.id
       WHERE pri.employee_id = $1 AND pr.month = $2 AND pr.year = $3`,
      [employeeId, month, year]
    );

    const item = itemRes.rows[0];
    if (!item) return null;

    // 2. Fetch Employee details & Bank Account
    const empRes = await dbService.query(
      `SELECT e.*, d.name as department_name, b.name as branch_name, des.name as designation_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN designations des ON e.designation_id = des.id
       WHERE e.id = $1`,
      [employeeId]
    );
    const emp = empRes.rows[0] || {};

    const bankRes = await dbService.query(
      `SELECT * FROM employee_bank_details WHERE employee_id = $1`,
      [employeeId]
    );
    const bank = bankRes.rows[0] || {};
    const rawAcc = bank.account_number || '0000000000';
    const maskedAcc = `XXXXXX${rawAcc.slice(-4)}`;

    // 3. Generate QR verification code
    const qrCode = `VERIFIED_PAYSLIP_${employeeId}_${month}_${year}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 4. Save/Upsert into payslip_documents
    const docRes = await dbService.query(
      `INSERT INTO payslip_documents (
        employee_id, month, year, gross_salary, net_salary, total_deductions, qr_verification_code, is_released, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      ON CONFLICT (employee_id, month, year) DO UPDATE SET
        gross_salary = EXCLUDED.gross_salary,
        net_salary = EXCLUDED.net_salary,
        total_deductions = EXCLUDED.total_deductions,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        employeeId, month, year, item.gross_salary, item.net_salary,
        (parseFloat(item.pf_deduction) + parseFloat(item.pt_deduction) + parseFloat(item.esi_deduction) + parseFloat(item.loan_deduction) + parseFloat(item.advance_deduction)),
        qrCode, creatorId
      ]
    );

    return {
      payslip_document: docRes.rows[0],
      employee: {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        employee_code: emp.employee_code,
        email: emp.email,
        department: emp.department_name || 'Engineering',
        designation: emp.designation_name || 'Software Engineer',
        branch: emp.branch_name || 'Headquarters',
        joining_date: emp.joining_date,
        bank_name: bank.bank_name || 'HDFC Bank',
        account_number_masked: maskedAcc,
        ifsc_code: bank.ifsc_code || 'HDFC0001234',
        payment_mode: bank.payment_mode || 'BANK_TRANSFER',
      },
      payroll_period: { month, year, working_days: item.working_days, present_days: item.present_days, lop_days: item.lop_days },
      earnings: {
        basic: parseFloat(item.basic_salary),
        hra: parseFloat(item.hra),
        special_allowance: parseFloat(item.special_allowance),
        overtime_pay: parseFloat(item.overtime_pay),
        bonus: parseFloat(item.bonus),
        reimbursements: parseFloat(item.reimbursements),
        gross_salary: parseFloat(item.gross_salary),
      },
      deductions: {
        pf: parseFloat(item.pf_deduction),
        pt: parseFloat(item.pt_deduction),
        esi: parseFloat(item.esi_deduction),
        loan_emi: parseFloat(item.loan_deduction),
        salary_advance: parseFloat(item.advance_deduction),
        lop_deduction: parseFloat(item.lop_deduction),
        total_deductions: (parseFloat(item.pf_deduction) + parseFloat(item.pt_deduction) + parseFloat(item.esi_deduction) + parseFloat(item.loan_deduction) + parseFloat(item.advance_deduction)),
      },
      net_salary: parseFloat(item.net_salary),
      qr_verification_code: qrCode,
    };
  }

  // ─── Payslip Download Logger ──────────────────────────────────────────────
  async logDownload(payslipId: number, employeeId: number, ipAddress = '127.0.0.1') {
    await dbService.query(
      `INSERT INTO payslip_download_logs (payslip_id, employee_id, ip_address) VALUES ($1, $2, $3)`,
      [payslipId, employeeId, ipAddress]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYSLIP_DOWNLOADED', 'EMPLOYEE_PAYROLL_PORTAL', $2)`,
      [employeeId, `Downloaded digital payslip #${payslipId} from IP ${ipAddress}`]
    );
  }

  // ─── Salary Certificates Engine ───────────────────────────────────────────
  async requestSalaryCertificate(dto: CertificateRequestDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO salary_certificates (employee_id, certificate_type, issued_date, purpose, status, created_by)
       VALUES ($1, $2, CURRENT_DATE, $3, 'ISSUED', $4) RETURNING *`,
      [dto.employee_id, dto.certificate_type, dto.purpose, creatorId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'SALARY_CERTIFICATE_ISSUED', 'EMPLOYEE_PAYROLL_PORTAL', $2)`,
      [creatorId, `Issued ${dto.certificate_type} for Employee #${dto.employee_id}`]
    );

    return res.rows[0];
  }

  async getSalaryCertificates(employeeId?: number) {
    let sql = `
      SELECT sc.*, e.first_name, e.last_name, e.employee_code
      FROM salary_certificates sc
      JOIN employees e ON sc.employee_id = e.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE sc.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY sc.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Employee Self-Service Payroll Feed ───────────────────────────────────
  async getEmployeeSelfServiceFeed(employeeId: number) {
    const [salRes, payslipRes, loanRes, advRes, revRes] = await Promise.all([
      dbService.query(`SELECT * FROM employee_salary_assignments WHERE employee_id = $1 AND is_active = true`, [employeeId]),
      dbService.query(`SELECT * FROM payslip_documents WHERE employee_id = $1 ORDER BY year DESC, created_at DESC LIMIT 6`, [employeeId]),
      dbService.query(`SELECT * FROM employee_loans WHERE employee_id = $1 AND status = 'APPROVED'`, [employeeId]),
      dbService.query(`SELECT * FROM employee_salary_advances WHERE employee_id = $1 AND status = 'APPROVED'`, [employeeId]),
      dbService.query(`SELECT * FROM salary_revisions WHERE employee_id = $1 ORDER BY created_at DESC`, [employeeId]),
    ]);

    return {
      active_assignment: salRes.rows[0] || null,
      recent_payslips: payslipRes.rows,
      active_loans: loanRes.rows,
      active_advances: advRes.rows,
      salary_revisions: revRes.rows,
    };
  }
}

export const payslipPortalRepository = new PayslipPortalRepository();
