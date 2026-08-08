import dbService from './db.js';

export async function initializeSchema() {
  await dbService.query(`
    CREATE TABLE IF NOT EXISTS regions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(30) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      region_id INTEGER REFERENCES regions(id),
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      country VARCHAR(100) DEFAULT 'India',
      timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
      address TEXT NOT NULL,
      latitude NUMERIC(10, 6) DEFAULT 12.971598,
      longitude NUMERIC(10, 6) DEFAULT 77.594566,
      geofence_radius_meters INTEGER DEFAULT 500,
      is_headquarters BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      role_name VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100) NOT NULL,
      description TEXT,
      is_system_role BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      permission_code VARCHAR(100) NOT NULL UNIQUE,
      category VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      scope VARCHAR(30) DEFAULT 'ORGANIZATION', -- 'ORGANIZATION' | 'BRANCH' | 'DEPARTMENT' | 'SELF'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_branch_transfers (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      from_branch_id INTEGER REFERENCES branches(id),
      to_branch_id INTEGER NOT NULL REFERENCES branches(id),
      transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
      reason TEXT NOT NULL,
      transferred_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      head_employee_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      employee_code VARCHAR(50) NOT NULL UNIQUE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
      department_id INTEGER REFERENCES departments(id),
      branch_id INTEGER REFERENCES branches(id),
      designation VARCHAR(100) NOT NULL,
      joining_date DATE NOT NULL,
      salary NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
      bank_account VARCHAR(50),
      ifsc_code VARCHAR(20),
      pan_number VARCHAR(20),
      aadhaar_number VARCHAR(20),
      emergency_contact_name VARCHAR(100),
      emergency_contact_phone VARCHAR(20),
      reporting_manager_id INTEGER REFERENCES employees(id),
      avatar_url TEXT,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      date DATE NOT NULL,
      punch_in TIMESTAMP,
      punch_out TIMESTAMP,
      punch_in_lat NUMERIC(10, 6),
      punch_in_lng NUMERIC(10, 6),
      punch_out_lat NUMERIC(10, 6),
      punch_out_lng NUMERIC(10, 6),
      work_hours NUMERIC(4, 2) DEFAULT 0.0,
      break_duration_mins INTEGER DEFAULT 0,
      shift_name VARCHAR(50) DEFAULT 'General Shift (9 AM - 6 PM)',
      is_late BOOLEAN DEFAULT false,
      is_overtime BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'PRESENT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      color VARCHAR(20) DEFAULT '#3B82F6',
      days_allowed INTEGER NOT NULL DEFAULT 12,
      is_carry_forward BOOLEAN DEFAULT true,
      is_paid BOOLEAN DEFAULT true,
      is_encashable BOOLEAN DEFAULT false,
      max_consecutive_days INTEGER DEFAULT 14,
      requires_attachment BOOLEAN DEFAULT false,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_policies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      leave_type_id INTEGER REFERENCES leave_types(id),
      annual_allocation NUMERIC(5, 1) NOT NULL DEFAULT 12.0,
      monthly_accrual NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
      max_balance NUMERIC(5, 1) DEFAULT 30.0,
      carry_forward_limit NUMERIC(5, 1) DEFAULT 6.0,
      encashment_limit NUMERIC(5, 1) DEFAULT 0.0,
      half_day_allowed BOOLEAN DEFAULT true,
      hourly_leave_allowed BOOLEAN DEFAULT false,
      negative_balance_allowed BOOLEAN DEFAULT false,
      probation_applicable BOOLEAN DEFAULT true,
      min_notice_days INTEGER DEFAULT 0,
      max_consecutive_days INTEGER DEFAULT 14,
      attachment_required BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      branch_id INTEGER REFERENCES branches(id),
      department_id INTEGER REFERENCES departments(id),
      deleted_at TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_policy_assignments (
      id SERIAL PRIMARY KEY,
      policy_id INTEGER NOT NULL REFERENCES leave_policies(id),
      employee_id INTEGER REFERENCES employees(id),
      department_id INTEGER REFERENCES departments(id),
      branch_id INTEGER REFERENCES branches(id),
      role VARCHAR(50),
      employment_type VARCHAR(50),
      effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
      expiry_date DATE,
      is_active BOOLEAN DEFAULT true,
      deleted_at TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_encashments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      days_encashed NUMERIC(5, 1) NOT NULL,
      amount_per_day NUMERIC(10, 2) NOT NULL,
      total_amount NUMERIC(12, 2) NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING',
      approved_by INTEGER REFERENCES employees(id),
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_settings (
      id SERIAL PRIMARY KEY,
      leave_year_start_month INTEGER DEFAULT 1,
      auto_carry_forward BOOLEAN DEFAULT true,
      max_negative_days NUMERIC(4, 1) DEFAULT 0,
      sandwich_rule_enabled BOOLEAN DEFAULT false,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_applications (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days NUMERIC(4, 1) NOT NULL,
      is_half_day BOOLEAN DEFAULT false,
      half_day_session VARCHAR(20),
      is_hourly BOOLEAN DEFAULT false,
      hours_requested NUMERIC(4, 2),
      reason TEXT NOT NULL,
      emergency_contact VARCHAR(50),
      contact_during_leave VARCHAR(100),
      work_handover TEXT,
      replacement_employee_id INTEGER REFERENCES employees(id),
      attachment_url TEXT,
      status VARCHAR(30) DEFAULT 'MANAGER_PENDING',
      manager_id INTEGER REFERENCES employees(id),
      manager_action VARCHAR(20),
      manager_comment TEXT,
      manager_actioned_at TIMESTAMP,
      hr_id INTEGER REFERENCES employees(id),
      hr_action VARCHAR(20),
      hr_comment TEXT,
      hr_actioned_at TIMESTAMP,
      approver_id INTEGER REFERENCES employees(id),
      rejection_reason TEXT,
      attendance_synced BOOLEAN DEFAULT false,
      payroll_synced BOOLEAN DEFAULT false,
      deleted_at TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_approvals (
      id SERIAL PRIMARY KEY,
      leave_id INTEGER NOT NULL REFERENCES leave_applications(id),
      approver_id INTEGER NOT NULL REFERENCES employees(id),
      level VARCHAR(20) NOT NULL DEFAULT 'MANAGER',
      action VARCHAR(20) NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_request_comments (
      id SERIAL PRIMARY KEY,
      leave_id INTEGER NOT NULL REFERENCES leave_applications(id),
      commenter_id INTEGER NOT NULL REFERENCES employees(id),
      comment TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_conflicts (
      id SERIAL PRIMARY KEY,
      leave_id INTEGER NOT NULL REFERENCES leave_applications(id),
      conflict_type VARCHAR(50) NOT NULL,
      conflict_description TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'WARNING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_balance_transactions (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      transaction_type VARCHAR(50) NOT NULL,
      days_changed NUMERIC(5, 1) NOT NULL,
      opening_balance NUMERIC(5, 1) NOT NULL,
      closing_balance NUMERIC(5, 1) NOT NULL,
      reference_type VARCHAR(50),
      reference_id INTEGER,
      description TEXT NOT NULL,
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_adjustments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      adjustment_type VARCHAR(30) NOT NULL,
      days NUMERIC(5, 1) NOT NULL,
      reason TEXT NOT NULL,
      approved_by INTEGER NOT NULL REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_comp_offs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      date_worked DATE NOT NULL,
      days_granted NUMERIC(4, 1) NOT NULL DEFAULT 1.0,
      expiry_date DATE NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING',
      reason TEXT NOT NULL,
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_accrual_history (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      accrual_period VARCHAR(20) NOT NULL,
      days_accrued NUMERIC(5, 1) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_carry_forward_history (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      year INTEGER NOT NULL,
      days_carried NUMERIC(5, 1) NOT NULL,
      days_expired NUMERIC(5, 1) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_balances (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      total_allocated NUMERIC(5, 1) NOT NULL DEFAULT 12,
      used_days NUMERIC(5, 1) DEFAULT 0,
      remaining_days NUMERIC(5, 1) NOT NULL DEFAULT 12,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, leave_type_id)
    );

    CREATE TABLE IF NOT EXISTS leave_balance_ledger (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      transaction_type VARCHAR(50) NOT NULL, -- 'ACCRUAL' | 'LEAVE_TAKEN' | 'CANCELLATION' | 'ADJUSTMENT_INCREASE' | 'ADJUSTMENT_DECREASE' | 'EXPIRY' | 'ENCASHMENT'
      amount NUMERIC(5, 2) NOT NULL,
      opening_balance NUMERIC(5, 2) NOT NULL,
      closing_balance NUMERIC(5, 2) NOT NULL,
      reason TEXT,
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_encashments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      requested_days NUMERIC(5, 2) NOT NULL,
      amount_per_day NUMERIC(10, 2) DEFAULT 0,
      total_amount NUMERIC(12, 2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holiday_regions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id),
      region_code VARCHAR(50) DEFAULT 'COMMON',
      name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(50) DEFAULT 'NATIONAL',
      is_optional BOOLEAN DEFAULT false,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      event_type VARCHAR(50) DEFAULT 'TOWNHALL',
      branch_id INTEGER REFERENCES branches(id),
      department_id INTEGER REFERENCES departments(id),
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS optional_holiday_selections (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      holiday_id INTEGER NOT NULL REFERENCES holidays(id),
      year INTEGER NOT NULL,
      status VARCHAR(30) DEFAULT 'APPROVED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, holiday_id, year)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id),
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payrolls (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      month VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      basic_salary NUMERIC(12, 2) NOT NULL,
      hra NUMERIC(12, 2) NOT NULL,
      conveyance NUMERIC(12, 2) NOT NULL,
      allowances NUMERIC(12, 2) NOT NULL,
      gross_salary NUMERIC(12, 2) NOT NULL,
      pf_deduction NUMERIC(12, 2) NOT NULL,
      esi_deduction NUMERIC(12, 2) NOT NULL,
      tds_deduction NUMERIC(12, 2) NOT NULL,
      net_salary NUMERIC(12, 2) NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'PAID',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_runs (
      id SERIAL PRIMARY KEY,
      period_name VARCHAR(50) NOT NULL UNIQUE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(30) DEFAULT 'DRAFT', -- 'DRAFT' | 'APPROVED' | 'LOCKED'
      gross_payroll NUMERIC(14, 2) DEFAULT 0,
      total_deductions NUMERIC(14, 2) DEFAULT 0,
      net_payroll NUMERIC(14, 2) DEFAULT 0,
      locked_by INTEGER REFERENCES employees(id),
      locked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_components (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL, -- 'EARNING' | 'DEDUCTION'
      calculation_type VARCHAR(30) DEFAULT 'PERCENTAGE_OF_BASIC', -- 'FLAT' | 'PERCENTAGE_OF_BASIC' | 'PERCENTAGE_OF_CTC'
      default_value NUMERIC(10, 2) DEFAULT 0,
      is_taxable BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      annual_ctc NUMERIC(14, 2) NOT NULL,
      employment_type VARCHAR(30) DEFAULT 'PERMANENT',
      branch_id INTEGER REFERENCES branches(id),
      department_id INTEGER REFERENCES departments(id),
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES employees(id),
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_template_components (
      id SERIAL PRIMARY KEY,
      template_id INTEGER NOT NULL REFERENCES salary_templates(id) ON DELETE CASCADE,
      component_id INTEGER NOT NULL REFERENCES salary_components(id),
      amount NUMERIC(12, 2) DEFAULT 0,
      percentage NUMERIC(5, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_salary_assignments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) UNIQUE,
      template_id INTEGER REFERENCES salary_templates(id),
      annual_ctc NUMERIC(14, 2) NOT NULL,
      monthly_gross NUMERIC(12, 2) NOT NULL,
      monthly_net NUMERIC(12, 2) NOT NULL,
      basic_salary NUMERIC(12, 2) NOT NULL,
      hra NUMERIC(12, 2) NOT NULL,
      special_allowance NUMERIC(12, 2) NOT NULL,
      pf_deduction NUMERIC(12, 2) DEFAULT 0,
      esi_deduction NUMERIC(12, 2) DEFAULT 0,
      pt_deduction NUMERIC(12, 2) DEFAULT 200,
      tds_deduction NUMERIC(12, 2) DEFAULT 0,
      effective_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES employees(id),
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_revisions (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      old_ctc NUMERIC(14, 2) NOT NULL,
      new_ctc NUMERIC(14, 2) NOT NULL,
      revision_type VARCHAR(50) NOT NULL, -- 'ANNUAL_INCREMENT' | 'PROMOTION' | 'MARKET_CORRECTION' | 'TRANSFER' | 'MANUAL'
      effective_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'APPROVED', -- 'PENDING' | 'APPROVED' | 'REJECTED'
      approved_by INTEGER REFERENCES employees(id),
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_component_master (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(30) NOT NULL, -- 'EARNING' | 'DEDUCTION' | 'REIMBURSEMENT' | 'BENEFIT' | 'TAX'
      calculation_mode VARCHAR(30) DEFAULT 'PERCENTAGE', -- 'FLAT' | 'PERCENTAGE' | 'FORMULA'
      formula_expression TEXT,
      min_value NUMERIC(10, 2) DEFAULT 0,
      max_value NUMERIC(12, 2),
      is_taxable BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES employees(id),
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_loans (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      loan_amount NUMERIC(12, 2) NOT NULL,
      interest_rate NUMERIC(5, 2) DEFAULT 0,
      tenure_months INTEGER NOT NULL,
      emi_amount NUMERIC(10, 2) NOT NULL,
      total_repaid NUMERIC(12, 2) DEFAULT 0,
      outstanding_balance NUMERIC(12, 2) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED'
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_salary_advances (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      advance_amount NUMERIC(12, 2) NOT NULL,
      monthly_deduction NUMERIC(10, 2) NOT NULL,
      total_recovered NUMERIC(12, 2) DEFAULT 0,
      outstanding_balance NUMERIC(12, 2) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED'
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_bank_details (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) UNIQUE,
      account_holder_name VARCHAR(150) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      ifsc_code VARCHAR(30) NOT NULL,
      branch_name VARCHAR(100),
      payment_mode VARCHAR(30) DEFAULT 'BANK_TRANSFER',
      is_verified BOOLEAN DEFAULT true,
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_runs (
      id SERIAL PRIMARY KEY,
      month VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      status VARCHAR(30) DEFAULT 'PREVIEW', -- 'PREVIEW' | 'SUBMITTED' | 'APPROVED' | 'LOCKED'
      total_gross NUMERIC(14, 2) DEFAULT 0,
      total_deductions NUMERIC(14, 2) DEFAULT 0,
      total_net NUMERIC(14, 2) DEFAULT 0,
      total_employees INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES employees(id),
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(month, year)
    );

    CREATE TABLE IF NOT EXISTS payroll_run_items (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      basic_salary NUMERIC(12, 2) DEFAULT 0,
      hra NUMERIC(12, 2) DEFAULT 0,
      special_allowance NUMERIC(12, 2) DEFAULT 0,
      overtime_pay NUMERIC(12, 2) DEFAULT 0,
      night_shift_pay NUMERIC(12, 2) DEFAULT 0,
      bonus NUMERIC(12, 2) DEFAULT 0,
      reimbursements NUMERIC(12, 2) DEFAULT 0,
      gross_salary NUMERIC(12, 2) DEFAULT 0,
      pf_deduction NUMERIC(12, 2) DEFAULT 0,
      pt_deduction NUMERIC(12, 2) DEFAULT 0,
      esi_deduction NUMERIC(12, 2) DEFAULT 0,
      tds_deduction NUMERIC(12, 2) DEFAULT 0,
      loan_deduction NUMERIC(12, 2) DEFAULT 0,
      advance_deduction NUMERIC(12, 2) DEFAULT 0,
      lop_deduction NUMERIC(12, 2) DEFAULT 0,
      arrears NUMERIC(12, 2) DEFAULT 0,
      net_salary NUMERIC(12, 2) DEFAULT 0,
      working_days INTEGER DEFAULT 22,
      present_days INTEGER DEFAULT 22,
      absent_days INTEGER DEFAULT 0,
      lop_days NUMERIC(5, 1) DEFAULT 0,
      ot_hours NUMERIC(5, 1) DEFAULT 0,
      warning_flags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_approvals (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      approver_id INTEGER NOT NULL REFERENCES employees(id),
      level VARCHAR(30) NOT NULL, -- 'PAYROLL_MANAGER' | 'FINANCE_MANAGER' | 'HR_MANAGER' | 'SUPER_ADMIN'
      status VARCHAR(20) DEFAULT 'APPROVED',
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payslip_documents (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      month VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      gross_salary NUMERIC(12, 2) NOT NULL,
      net_salary NUMERIC(12, 2) NOT NULL,
      total_deductions NUMERIC(12, 2) NOT NULL,
      qr_verification_code VARCHAR(100) UNIQUE NOT NULL,
      is_released BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS payslip_download_logs (
      id SERIAL PRIMARY KEY,
      payslip_id INTEGER NOT NULL REFERENCES payslip_documents(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      ip_address VARCHAR(50),
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_certificates (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      certificate_type VARCHAR(50) NOT NULL, -- 'SALARY_CERTIFICATE' | 'EMPLOYMENT_LETTER' | 'COMPENSATION_LETTER' | 'INCREMENT_LETTER'
      issued_date DATE NOT NULL,
      purpose TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'ISSUED',
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bonus_master (
      id SERIAL PRIMARY KEY,
      bonus_name VARCHAR(150) NOT NULL,
      bonus_type VARCHAR(50) NOT NULL, -- 'PERFORMANCE' | 'FESTIVAL' | 'ANNUAL' | 'RETENTION' | 'REFERRAL' | 'JOINING' | 'PROJECT_COMPLETION' | 'SALES' | 'SPOT_AWARD'
      calculation_mode VARCHAR(30) DEFAULT 'FIXED', -- 'FIXED' | 'PERCENTAGE'
      formula_expression TEXT,
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_bonuses (
      id SERIAL PRIMARY KEY,
      bonus_id INTEGER REFERENCES bonus_master(id),
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      bonus_amount NUMERIC(12, 2) NOT NULL,
      payout_month VARCHAR(20) NOT NULL,
      payout_year INTEGER NOT NULL,
      reason TEXT,
      status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_incentives (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      incentive_type VARCHAR(50) NOT NULL, -- 'SALES' | 'PROJECT' | 'PERFORMANCE' | 'ATTENDANCE' | 'TARGET_ACHIEVEMENT'
      amount NUMERIC(12, 2) NOT NULL,
      payout_month VARCHAR(20) NOT NULL,
      payout_year INTEGER NOT NULL,
      reason TEXT,
      status VARCHAR(30) DEFAULT 'APPROVED',
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_budgets (
      id SERIAL PRIMARY KEY,
      department_id INTEGER NOT NULL REFERENCES departments(id) UNIQUE,
      year INTEGER NOT NULL,
      annual_budget NUMERIC(14, 2) NOT NULL,
      spent_amount NUMERIC(14, 2) DEFAULT 0,
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_resignations (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      resignation_date DATE NOT NULL,
      last_working_day DATE NOT NULL,
      notice_period_days INTEGER DEFAULT 30,
      reason TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
      manager_approved BOOLEAN DEFAULT false,
      hr_approved BOOLEAN DEFAULT false,
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exit_department_clearances (
      id SERIAL PRIMARY KEY,
      resignation_id INTEGER NOT NULL REFERENCES employee_resignations(id) ON DELETE CASCADE,
      department VARCHAR(30) NOT NULL, -- 'HR' | 'FINANCE' | 'IT' | 'ADMIN' | 'MANAGER'
      status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'CLEARED' | 'REJECTED'
      comments TEXT,
      cleared_by INTEGER REFERENCES employees(id),
      cleared_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resignation_id, department)
    );

    CREATE TABLE IF NOT EXISTS project_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_clients (
      id SERIAL PRIMARY KEY,
      client_name VARCHAR(150) NOT NULL,
      company_name VARCHAR(150),
      email VARCHAR(150),
      phone VARCHAR(30),
      address TEXT,
      status VARCHAR(30) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      role_in_project VARCHAR(50) DEFAULT 'MEMBER', -- 'PROJECT_MANAGER' | 'TEAM_LEAD' | 'DEVELOPER' | 'QA' | 'MEMBER'
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS project_documents (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      document_name VARCHAR(200) NOT NULL,
      file_url TEXT NOT NULL,
      file_type VARCHAR(50),
      uploaded_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_sprints (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      sprint_name VARCHAR(100) NOT NULL,
      sprint_goal TEXT,
      start_date DATE,
      end_date DATE,
      status VARCHAR(30) DEFAULT 'ACTIVE', -- 'PLANNING' | 'ACTIVE' | 'CLOSED'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_tasks (
      id SERIAL PRIMARY KEY,
      task_number VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      sprint_id INTEGER REFERENCES project_sprints(id),
      task_type VARCHAR(50) DEFAULT 'FEATURE', -- 'BUG' | 'FEATURE' | 'ENHANCEMENT' | 'DOCUMENTATION' | 'TASK'
      priority VARCHAR(30) DEFAULT 'MEDIUM', -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      status VARCHAR(30) DEFAULT 'TO_DO', -- 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED'
      assignee_id INTEGER REFERENCES employees(id),
      reporter_id INTEGER REFERENCES employees(id),
      estimated_hours INTEGER DEFAULT 0,
      actual_hours INTEGER DEFAULT 0,
      story_points INTEGER DEFAULT 3,
      progress_percentage INTEGER DEFAULT 0,
      due_date DATE,
      created_by INTEGER REFERENCES employees(id),
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_checklists (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
      item_text VARCHAR(200) NOT NULL,
      is_completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_daily_reports (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      report_date DATE NOT NULL,
      completed_work TEXT NOT NULL,
      upcoming_plan TEXT,
      blockers TEXT,
      hours_worked NUMERIC(4, 2) DEFAULT 8.0,
      status VARCHAR(30) DEFAULT 'SUBMITTED', -- 'SUBMITTED' | 'APPROVED' | 'REJECTED'
      manager_feedback TEXT,
      reviewed_by INTEGER REFERENCES employees(id),
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES employees(id),
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_activity_feed (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
      actor_id INTEGER REFERENCES employees(id),
      action_type VARCHAR(50) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      week_number INTEGER NOT NULL,
      year INTEGER NOT NULL,
      status VARCHAR(30) DEFAULT 'ACTIVE', -- 'ACTIVE' | 'SUBMITTED' | 'APPROVED'
      assigned_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, week_number, year)
    );

    CREATE TABLE IF NOT EXISTS weekly_plan_items (
      id SERIAL PRIMARY KEY,
      plan_id INTEGER NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
      day_of_week VARCHAR(20) NOT NULL, -- 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
      task_name VARCHAR(200) NOT NULL,
      planned_hours NUMERIC(4, 2) DEFAULT 8.0,
      actual_hours NUMERIC(4, 2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'PLANNED', -- 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
      project_id INTEGER REFERENCES projects(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS active_work_timers (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) UNIQUE,
      project_id INTEGER REFERENCES projects(id),
      task_id INTEGER REFERENCES project_tasks(id),
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_paused BOOLEAN DEFAULT false,
      accum_seconds INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      project_id INTEGER REFERENCES projects(id),
      task_id INTEGER REFERENCES project_tasks(id),
      entry_date DATE NOT NULL,
      hours_worked NUMERIC(4, 2) NOT NULL,
      is_billable BOOLEAN DEFAULT true,
      is_overtime BOOLEAN DEFAULT false,
      description TEXT,
      status VARCHAR(30) DEFAULT 'SUBMITTED', -- 'SUBMITTED' | 'APPROVED' | 'REJECTED'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timesheet_approvals (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      week_number INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total_hours NUMERIC(5, 2) NOT NULL,
      billable_hours NUMERIC(5, 2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED'
      approved_by INTEGER REFERENCES employees(id),
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, week_number, year)
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      milestone_name VARCHAR(200) NOT NULL,
      planned_date DATE NOT NULL,
      actual_date DATE,
      status VARCHAR(30) DEFAULT 'PLANNED', -- 'PLANNED' | 'ACHIEVED' | 'DELAYED'
      owner_id INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_risks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      risk_description TEXT NOT NULL,
      severity VARCHAR(30) DEFAULT 'MEDIUM', -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      probability VARCHAR(30) DEFAULT 'MEDIUM', -- 'HIGH' | 'MEDIUM' | 'LOW'
      mitigation_plan TEXT,
      status VARCHAR(30) DEFAULT 'OPEN', -- 'OPEN' | 'MITIGATED' | 'CLOSED'
      owner_id INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      company_name VARCHAR(200) NOT NULL,
      contact_person VARCHAR(150),
      email VARCHAR(150) UNIQUE NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      industry VARCHAR(100),
      status VARCHAR(30) DEFAULT 'ACTIVE', -- 'ACTIVE' | 'INACTIVE'
      account_manager_id INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_users (
      id SERIAL PRIMARY KEY,
      client_org_id INTEGER NOT NULL REFERENCES client_organizations(id) ON DELETE CASCADE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(30) DEFAULT 'CLIENT_ADMIN', -- 'CLIENT_ADMIN' | 'CLIENT_APPROVER' | 'CLIENT_VIEWER'
      status VARCHAR(30) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_project_access (
      id SERIAL PRIMARY KEY,
      client_org_id INTEGER NOT NULL REFERENCES client_organizations(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      access_level VARCHAR(30) DEFAULT 'FULL', -- 'FULL' | 'READ_ONLY' | 'LIMITED'
      granted_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_org_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS project_deliverables (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      due_date DATE,
      status VARCHAR(30) DEFAULT 'SUBMITTED', -- 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
      version VARCHAR(20) DEFAULT 'v1.0',
      approval_status VARCHAR(30) DEFAULT 'UNDER_REVIEW',
      client_comments TEXT,
      reviewed_by INTEGER REFERENCES client_users(id),
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_change_requests (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      client_user_id INTEGER REFERENCES client_users(id),
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      reason TEXT,
      priority VARCHAR(30) DEFAULT 'MEDIUM', -- 'HIGH' | 'MEDIUM' | 'LOW'
      status VARCHAR(30) DEFAULT 'SUBMITTED', -- 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
      manager_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_settings (
      id SERIAL PRIMARY KEY,
      payroll_cycle VARCHAR(20) DEFAULT 'MONTHLY',
      cutoff_day INTEGER DEFAULT 25,
      pay_day INTEGER DEFAULT 1,
      working_days_month INTEGER DEFAULT 22,
      pf_rate NUMERIC(5, 2) DEFAULT 12.00,
      esi_rate NUMERIC(5, 2) DEFAULT 0.75,
      pt_amount NUMERIC(10, 2) DEFAULT 200.00,
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      expense_number VARCHAR(50) UNIQUE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      merchant_name VARCHAR(150),
      date DATE NOT NULL,
      description TEXT,
      receipt_url TEXT,
      project_id INTEGER REFERENCES projects(id),
      status VARCHAR(30) DEFAULT 'SUBMITTED', -- 'SUBMITTED' | 'MANAGER_APPROVED' | 'FINANCE_APPROVED' | 'REJECTED' | 'REIMBURSED'
      approved_by INTEGER REFERENCES employees(id),
      reimbursed_amount NUMERIC(12, 2),
      payment_status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'PAID' | 'FAILED'
      payment_reference VARCHAR(100),
      policy_warning TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_advances (
      id SERIAL PRIMARY KEY,
      advance_number VARCHAR(50) NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      advance_amount NUMERIC(12, 2) NOT NULL,
      purpose TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL' | 'APPROVED' | 'SETTLED'
      settled_amount NUMERIC(12, 2) DEFAULT 0,
      is_settled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_policy_rules (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL UNIQUE,
      max_limit_amount NUMERIC(12, 2) DEFAULT 25000,
      receipt_required BOOLEAN DEFAULT true,
      manager_approval_required BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_risk_flags (
      id SERIAL PRIMARY KEY,
      expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      risk_level VARCHAR(30) DEFAULT 'LOW', -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      risk_reason TEXT NOT NULL,
      is_duplicate BOOLEAN DEFAULT false,
      is_cleared BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_budgets (
      id SERIAL PRIMARY KEY,
      cost_center_name VARCHAR(100) NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      total_budget_amount NUMERIC(14, 2) NOT NULL,
      committed_amount NUMERIC(14, 2) DEFAULT 0,
      paid_amount NUMERIC(14, 2) DEFAULT 0,
      financial_year VARCHAR(20) DEFAULT '2026-2027',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_reconciliations (
      id SERIAL PRIMARY KEY,
      expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      approved_amount NUMERIC(12, 2) NOT NULL,
      paid_amount NUMERIC(12, 2) NOT NULL,
      status VARCHAR(30) DEFAULT 'MATCHED', -- 'MATCHED' | 'MISMATCH'
      payment_reference VARCHAR(100),
      reconciled_by INTEGER REFERENCES employees(id),
      reconciled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_period_locks (
      id SERIAL PRIMARY KEY,
      period_name VARCHAR(50) NOT NULL UNIQUE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_locked BOOLEAN DEFAULT false,
      locked_by INTEGER REFERENCES employees(id),
      locked_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      client_name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      budget NUMERIC(14, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'IN_PROGRESS',
      progress INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'DEVELOPER',
      UNIQUE(project_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to INTEGER REFERENCES employees(id),
      due_date DATE NOT NULL,
      priority VARCHAR(20) DEFAULT 'MEDIUM',
      status VARCHAR(20) DEFAULT 'TODO',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recruitments (
      id SERIAL PRIMARY KEY,
      job_title VARCHAR(255) NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      openings INTEGER NOT NULL DEFAULT 1,
      experience_required VARCHAR(50) NOT NULL,
      salary_range VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      recruitment_id INTEGER NOT NULL REFERENCES recruitments(id) ON DELETE CASCADE,
      candidate_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      resume_url TEXT,
      status VARCHAR(50) DEFAULT 'APPLIED',
      interview_date TIMESTAMP,
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      asset_name VARCHAR(255) NOT NULL,
      asset_code VARCHAR(50) NOT NULL UNIQUE,
      category VARCHAR(100) NOT NULL,
      serial_number VARCHAR(100) NOT NULL,
      assigned_to_employee_id INTEGER REFERENCES employees(id),
      purchase_date DATE NOT NULL,
      value NUMERIC(12, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'ALLOCATED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_assignments (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      assignment_date DATE NOT NULL,
      expected_return_date DATE,
      return_date DATE,
      condition_at_assignment VARCHAR(30) DEFAULT 'EXCELLENT',
      condition_at_return VARCHAR(30),
      status VARCHAR(30) DEFAULT 'ASSIGNED', -- 'ASSIGNED' | 'RETURNED'
      is_acknowledged BOOLEAN DEFAULT false,
      acknowledged_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_maintenance (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      maintenance_type VARCHAR(50) DEFAULT 'PREVENTIVE', -- 'PREVENTIVE' | 'REPAIR' | 'INSPECTION'
      description TEXT NOT NULL,
      cost NUMERIC(10, 2) DEFAULT 0,
      start_date DATE NOT NULL,
      end_date DATE,
      status VARCHAR(30) DEFAULT 'SCHEDULED', -- 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_issues (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      reported_by INTEGER NOT NULL REFERENCES employees(id),
      issue_type VARCHAR(50) DEFAULT 'DAMAGE', -- 'DAMAGE' | 'LOSS' | 'FUNCTIONAL' | 'WRONG_ITEM'
      description TEXT NOT NULL,
      severity VARCHAR(30) DEFAULT 'MEDIUM', -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      status VARCHAR(30) DEFAULT 'OPEN', -- 'OPEN' | 'IN_REPAIR' | 'RESOLVED'
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_requests (
      id SERIAL PRIMARY KEY,
      request_number VARCHAR(50) UNIQUE NOT NULL,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      category VARCHAR(100) NOT NULL,
      request_type VARCHAR(50) DEFAULT 'NEW_ASSET', -- 'NEW_ASSET' | 'REPLACEMENT' | 'UPGRADE'
      reason TEXT NOT NULL,
      priority VARCHAR(30) DEFAULT 'NORMAL', -- 'URGENT' | 'NORMAL' | 'LOW'
      required_date DATE,
      status VARCHAR(30) DEFAULT 'SUBMITTED', -- 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'IN_PROCUREMENT' | 'COMPLETED'
      estimated_cost NUMERIC(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      po_number VARCHAR(50) UNIQUE NOT NULL,
      request_id INTEGER REFERENCES asset_requests(id),
      vendor_name VARCHAR(150) NOT NULL,
      total_amount NUMERIC(12, 2) NOT NULL,
      status VARCHAR(30) DEFAULT 'APPROVED', -- 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
      expected_delivery DATE,
      created_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendor_quotations (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL REFERENCES asset_requests(id) ON DELETE CASCADE,
      vendor_name VARCHAR(150) NOT NULL,
      quotation_amount NUMERIC(12, 2) NOT NULL,
      delivery_days INTEGER DEFAULT 3,
      is_selected BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_warranty_claims (
      id SERIAL PRIMARY KEY,
      claim_number VARCHAR(50) UNIQUE NOT NULL,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      vendor_name VARCHAR(150),
      claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
      issue_description TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'CLAIM_SUBMITTED', -- 'CLAIM_SUBMITTED' | 'CLAIM_APPROVED' | 'RESOLVED' | 'REJECTED'
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_damage_investigations (
      id SERIAL PRIMARY KEY,
      issue_id INTEGER REFERENCES asset_issues(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      employee_id INTEGER REFERENCES employees(id),
      damage_severity VARCHAR(30) DEFAULT 'MODERATE', -- 'CRITICAL' | 'MODERATE' | 'MINOR'
      estimated_cost NUMERIC(10, 2) DEFAULT 0,
      responsibility VARCHAR(30) DEFAULT 'COMPANY', -- 'COMPANY' | 'EMPLOYEE' | 'SHARED'
      status VARCHAR(30) DEFAULT 'UNDER_INVESTIGATION', -- 'UNDER_INVESTIGATION' | 'RESOLVED' | 'RECOVERY_APPROVED'
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_payroll_recoveries (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      recovery_amount NUMERIC(10, 2) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING_FINANCE_APPROVAL', -- 'PENDING_FINANCE_APPROVAL' | 'PAYROLL_APPROVED' | 'COMPLETED'
      payroll_deducted BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_depreciation_schedules (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      purchase_cost NUMERIC(12, 2) NOT NULL,
      residual_value NUMERIC(12, 2) DEFAULT 0,
      useful_life_years INTEGER DEFAULT 3,
      method VARCHAR(30) DEFAULT 'STRAIGHT_LINE',
      annual_depreciation NUMERIC(12, 2) NOT NULL,
      monthly_depreciation NUMERIC(12, 2) NOT NULL,
      current_book_value NUMERIC(12, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_inventory_audits (
      id SERIAL PRIMARY KEY,
      audit_name VARCHAR(150) NOT NULL,
      auditor_id INTEGER REFERENCES employees(id),
      total_expected INTEGER DEFAULT 0,
      total_scanned INTEGER DEFAULT 0,
      missing_count INTEGER DEFAULT 0,
      status VARCHAR(30) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS' | 'COMPLETED'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_audit_findings (
      id SERIAL PRIMARY KEY,
      audit_id INTEGER NOT NULL REFERENCES asset_inventory_audits(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      expected_location VARCHAR(100),
      actual_location VARCHAR(100),
      discrepancy_type VARCHAR(50) DEFAULT 'MISSING', -- 'MISSING' | 'LOCATION_MISMATCH' | 'DAMAGED'
      status VARCHAR(30) DEFAULT 'OPEN', -- 'OPEN' | 'RECONCILED'
      reconciliation_action TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'INFO',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_config (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'MAIN',
      company_name VARCHAR(255) DEFAULT 'THEIAKSHI ENTERPRISES',
      shift_start_time VARCHAR(10) DEFAULT '09:00',
      shift_end_time VARCHAR(10) DEFAULT '18:00',
      grace_minutes INT DEFAULT 15,
      half_day_threshold_time VARCHAR(10) DEFAULT '11:30',
      auto_deduct_leave_for_two_half_days BOOLEAN DEFAULT TRUE,
      require_gps_clock_in BOOLEAN DEFAULT TRUE,
      currency VARCHAR(10) DEFAULT 'INR',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS geofence_settings (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'HQ',
      office_name VARCHAR(255) DEFAULT 'THEIAKSHI HQ - Bengaluru',
      latitude DECIMAL(10, 6) DEFAULT 12.9716,
      longitude DECIMAL(10, 6) DEFAULT 77.5946,
      radius_meters INT DEFAULT 500,
      enforce_strict_geofence BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_shifts (
      id SERIAL PRIMARY KEY,
      shift_name VARCHAR(100) NOT NULL UNIQUE,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      grace_period_minutes INTEGER DEFAULT 15,
      break_duration_minutes INTEGER DEFAULT 60,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      module VARCHAR(50) NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role VARCHAR(50) NOT NULL,
      permission_code VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, permission_code)
    );

    CREATE TABLE IF NOT EXISTS company_documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_url TEXT NOT NULL,
      version VARCHAR(20) DEFAULT '1.0',
      expiry_date DATE,
      uploaded_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id),
      action VARCHAR(100) NOT NULL,
      module VARCHAR(100) NOT NULL,
      details TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_regularizations (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      attendance_date DATE NOT NULL,
      request_type VARCHAR(50) NOT NULL DEFAULT 'MISSED_PUNCH',
      requested_punch_in TIMESTAMP,
      requested_punch_out TIMESTAMP,
      requested_break_start TIMESTAMP,
      requested_break_end TIMESTAMP,
      reason TEXT NOT NULL,
      supporting_notes TEXT,
      attachment_url TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING_MANAGER',
      manager_id INTEGER REFERENCES employees(id),
      manager_action VARCHAR(20),
      manager_comment TEXT,
      manager_actioned_at TIMESTAMP,
      hr_id INTEGER REFERENCES employees(id),
      hr_action VARCHAR(20),
      hr_comment TEXT,
      hr_actioned_at TIMESTAMP,
      admin_id INTEGER REFERENCES employees(id),
      admin_action VARCHAR(20),
      admin_comment TEXT,
      admin_actioned_at TIMESTAMP,
      approved_by INTEGER REFERENCES employees(id),
      approved_at TIMESTAMP,
      rejection_reason TEXT,
      attendance_updated BOOLEAN NOT NULL DEFAULT false,
      payroll_recalculated BOOLEAN NOT NULL DEFAULT false,
      deleted_at TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS regularization_comments (
      id SERIAL PRIMARY KEY,
      regularization_id INTEGER NOT NULL REFERENCES attendance_regularizations(id),
      commenter_id INTEGER NOT NULL REFERENCES employees(id),
      comment TEXT NOT NULL,
      is_internal BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS regularization_audit (
      id SERIAL PRIMARY KEY,
      regularization_id INTEGER NOT NULL REFERENCES attendance_regularizations(id),
      actor_id INTEGER NOT NULL REFERENCES employees(id),
      action VARCHAR(50) NOT NULL,
      from_status VARCHAR(30),
      to_status VARCHAR(30),
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for regularization queries
    CREATE INDEX IF NOT EXISTS idx_reg_emp ON attendance_regularizations(employee_id);
    CREATE INDEX IF NOT EXISTS idx_reg_date ON attendance_regularizations(attendance_date);
    CREATE INDEX IF NOT EXISTS idx_reg_status ON attendance_regularizations(status);
    CREATE INDEX IF NOT EXISTS idx_reg_manager ON attendance_regularizations(manager_id);
    CREATE INDEX IF NOT EXISTS idx_reg_comment ON regularization_comments(regularization_id);
    CREATE INDEX IF NOT EXISTS idx_reg_audit ON regularization_audit(regularization_id);


    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_url TEXT NOT NULL,
      expiry_date DATE,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      project_id INTEGER NOT NULL REFERENCES projects(id),
      task_id INTEGER REFERENCES tasks(id),
      date DATE NOT NULL,
      hours_spent NUMERIC(4, 2) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'APPROVED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS helpdesk_tickets (
      id SERIAL PRIMARY KEY,
      ticket_code VARCHAR(50) NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      category VARCHAR(50) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      priority VARCHAR(20) DEFAULT 'MEDIUM',
      status VARCHAR(20) DEFAULT 'OPEN',
      assigned_to INTEGER REFERENCES employees(id),
      asset_id INTEGER REFERENCES assets(id),
      resolution_notes TEXT,
      sla_due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES employees(id),
      comment_text TEXT NOT NULL,
      is_internal_note BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_sla_rules (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      priority VARCHAR(20) NOT NULL,
      resolution_hours INTEGER DEFAULT 24,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS celebrations (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      type VARCHAR(20) NOT NULL,
      event_date DATE NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'GENERAL',
      is_pinned BOOLEAN DEFAULT false,
      posted_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS performance_reviews (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      reviewer_id INTEGER NOT NULL REFERENCES employees(id),
      review_period VARCHAR(50) NOT NULL,
      rating NUMERIC(3, 1) NOT NULL,
      feedback TEXT NOT NULL,
      goals TEXT,
      status VARCHAR(20) DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_planners (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      week_start_date DATE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      priority VARCHAR(20) DEFAULT 'MEDIUM',
      status VARCHAR(20) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dashboard_preferences (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) UNIQUE,
      theme VARCHAR(20) DEFAULT 'light',
      default_tab VARCHAR(50) DEFAULT 'dashboard',
      layout_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dashboard_widgets (
      id SERIAL PRIMARY KEY,
      widget_key VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(100) NOT NULL,
      category VARCHAR(50) DEFAULT 'ANALYTICS',
      role_permissions TEXT DEFAULT 'ALL',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quick_actions (
      id SERIAL PRIMARY KEY,
      action_key VARCHAR(50) UNIQUE NOT NULL,
      label VARCHAR(100) NOT NULL,
      icon VARCHAR(50) NOT NULL,
      path VARCHAR(100) NOT NULL,
      role_permissions TEXT DEFAULT 'ALL',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Shift Management Tables
    CREATE TABLE IF NOT EXISTS shifts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(30) NOT NULL UNIQUE,
      start_time VARCHAR(5) NOT NULL DEFAULT '09:00',
      end_time VARCHAR(5) NOT NULL DEFAULT '18:00',
      grace_mins INTEGER NOT NULL DEFAULT 15,
      late_threshold_mins INTEGER NOT NULL DEFAULT 30,
      half_day_threshold_hours NUMERIC(4,2) NOT NULL DEFAULT 4.0,
      early_exit_threshold_mins INTEGER NOT NULL DEFAULT 60,
      break_duration_mins INTEGER NOT NULL DEFAULT 60,
      max_work_hours NUMERIC(4,2) NOT NULL DEFAULT 12.0,
      min_work_hours NUMERIC(4,2) NOT NULL DEFAULT 4.0,
      overtime_eligible BOOLEAN NOT NULL DEFAULT true,
      is_night_shift BOOLEAN NOT NULL DEFAULT false,
      is_wfh BOOLEAN NOT NULL DEFAULT false,
      auto_clockout_after_hours NUMERIC(4,2) NOT NULL DEFAULT 14.0,
      shift_type VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
      color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
      is_deleted BOOLEAN NOT NULL DEFAULT false,
      deleted_at TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_shift_assignments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      shift_id INTEGER NOT NULL REFERENCES shifts(id),
      effective_date DATE NOT NULL,
      expiry_date DATE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shift_swap_requests (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER NOT NULL REFERENCES employees(id),
      target_employee_id INTEGER NOT NULL REFERENCES employees(id),
      requester_shift_id INTEGER REFERENCES shifts(id),
      target_shift_id INTEGER REFERENCES shifts(id),
      shift_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      approved_by INTEGER REFERENCES employees(id),
      approved_at TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS overtime_requests (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      date DATE NOT NULL,
      expected_overtime_hours NUMERIC(4,2) NOT NULL DEFAULT 1.0,
      approved_hours NUMERIC(4,2),
      reason TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      approved_by INTEGER REFERENCES employees(id),
      approved_at TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Shift indexes
    CREATE INDEX IF NOT EXISTS idx_shifts_code ON shifts(code);
    CREATE INDEX IF NOT EXISTS idx_shift_assign_emp ON employee_shift_assignments(employee_id);
    CREATE INDEX IF NOT EXISTS idx_shift_assign_active ON employee_shift_assignments(is_active);
    CREATE INDEX IF NOT EXISTS idx_swap_req_status ON shift_swap_requests(status);
    CREATE INDEX IF NOT EXISTS idx_overtime_req_emp ON overtime_requests(employee_id);
    CREATE INDEX IF NOT EXISTS idx_overtime_req_status ON overtime_requests(status);

    -- Create View for backward compatibility with 'leaves'
    CREATE OR REPLACE VIEW leaves AS SELECT * FROM leave_applications;

    -- Create Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_emp_code ON employees(employee_code);
    CREATE INDEX IF NOT EXISTS idx_emp_email ON employees(email);
    CREATE INDEX IF NOT EXISTS idx_emp_dept ON employees(department_id);
    CREATE INDEX IF NOT EXISTS idx_emp_branch ON employees(branch_id);
    CREATE INDEX IF NOT EXISTS idx_att_emp_date ON attendance(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_applications(employee_id);
    CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_applications(status);
    CREATE INDEX IF NOT EXISTS idx_payroll_emp_year_month ON payrolls(employee_id, year, month);
    CREATE INDEX IF NOT EXISTS idx_tasks_proj ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_notif_emp ON notifications(employee_id);
  `);
}
