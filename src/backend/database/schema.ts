import dbService from './db.js';

export async function initializeSchema() {
  await dbService.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      tax_identifier VARCHAR(50),
      status VARCHAR(20) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS regions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(30) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
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
      organization_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      permission_code VARCHAR(100) UNIQUE NOT NULL,
      code VARCHAR(100) UNIQUE,
      name VARCHAR(255),
      category VARCHAR(100) NOT NULL,
      module VARCHAR(50),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
      role VARCHAR(50),
      permission_code VARCHAR(100),
      scope VARCHAR(30) DEFAULT 'ORGANIZATION',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, permission_code)
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      head_employee_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
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
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_branch_transfers (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      from_branch_id INTEGER REFERENCES branches(id),
      to_branch_id INTEGER NOT NULL REFERENCES branches(id),
      transfer_date DATE NOT NULL,
      reason TEXT,
      status VARCHAR(20) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_documents (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      document_type VARCHAR(100) NOT NULL,
      document_number VARCHAR(100),
      file_url TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING_VERIFICATION',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_onboarding_checklists (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      task_name VARCHAR(150) NOT NULL,
      is_completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      punch_in TIMESTAMP NOT NULL,
      punch_out TIMESTAMP,
      punch_in_lat NUMERIC(10, 6),
      punch_in_lng NUMERIC(10, 6),
      punch_out_lat NUMERIC(10, 6),
      punch_out_lng NUMERIC(10, 6),
      work_hours NUMERIC(4, 2) DEFAULT 0.00,
      break_duration_mins INTEGER DEFAULT 0,
      shift_name VARCHAR(100) DEFAULT 'General Shift',
      is_late BOOLEAN DEFAULT false,
      is_overtime BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'PRESENT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS attendance_regularizations (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL,
      requested_punch_in TIMESTAMP,
      requested_punch_out TIMESTAMP,
      reason TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      approved_by INTEGER REFERENCES employees(id),
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS regularization_comments (
      id SERIAL PRIMARY KEY,
      regularization_id INTEGER NOT NULL REFERENCES attendance_regularizations(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS regularization_audit (
      id SERIAL PRIMARY KEY,
      regularization_id INTEGER NOT NULL REFERENCES attendance_regularizations(id) ON DELETE CASCADE,
      action_taken VARCHAR(50) NOT NULL,
      actor_id INTEGER NOT NULL REFERENCES employees(id),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(30) NOT NULL UNIQUE,
      color VARCHAR(20) DEFAULT '#3B82F6',
      days_allowed INTEGER NOT NULL DEFAULT 12,
      is_paid BOOLEAN DEFAULT true,
      is_carry_forward BOOLEAN DEFAULT false,
      is_encashable BOOLEAN DEFAULT false,
      max_consecutive_days INTEGER DEFAULT 10,
      requires_attachment BOOLEAN DEFAULT false,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_policies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      description TEXT,
      probation_days_before_apply INTEGER DEFAULT 0,
      notice_period_days_before_apply INTEGER DEFAULT 0,
      max_continuous_days INTEGER DEFAULT 10,
      allow_advance_leave BOOLEAN DEFAULT false,
      encashment_allowed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_policy_assignments (
      id SERIAL PRIMARY KEY,
      policy_id INTEGER NOT NULL REFERENCES leave_policies(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_settings (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      financial_year_start DATE NOT NULL,
      financial_year_end DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_applications (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days NUMERIC(4, 1) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'MANAGER_PENDING',
      approver_id INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_approvals (
      id SERIAL PRIMARY KEY,
      leave_id INTEGER NOT NULL REFERENCES leave_applications(id) ON DELETE CASCADE,
      approver_id INTEGER NOT NULL REFERENCES employees(id),
      stage VARCHAR(30) NOT NULL,
      status VARCHAR(30) NOT NULL,
      comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_request_comments (
      id SERIAL PRIMARY KEY,
      leave_id INTEGER NOT NULL REFERENCES leave_applications(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_conflicts (
      id SERIAL PRIMARY KEY,
      leave_id INTEGER NOT NULL REFERENCES leave_applications(id) ON DELETE CASCADE,
      conflict_with_employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      conflict_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_balance_transactions (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      amount NUMERIC(4, 1) NOT NULL,
      transaction_type VARCHAR(30) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_adjustments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      days_adjusted NUMERIC(4, 1) NOT NULL,
      reason TEXT NOT NULL,
      adjusted_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_comp_offs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      worked_date DATE NOT NULL,
      expires_at DATE NOT NULL,
      status VARCHAR(30) DEFAULT 'AVAILABLE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_accrual_history (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      accrued_days NUMERIC(4, 2) NOT NULL,
      accrued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_carry_forward_history (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      days_carried_forward NUMERIC(4, 1) NOT NULL,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_balances (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      total_allocated NUMERIC(4, 1) NOT NULL DEFAULT 12,
      used_days NUMERIC(4, 1) NOT NULL DEFAULT 0,
      remaining_days NUMERIC(4, 1) NOT NULL DEFAULT 12,
      UNIQUE(employee_id, leave_type_id)
    );

    CREATE TABLE IF NOT EXISTS leave_balance_ledger (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      transaction_date DATE NOT NULL,
      opening_balance NUMERIC(4, 1) NOT NULL,
      change_amount NUMERIC(4, 1) NOT NULL,
      closing_balance NUMERIC(4, 1) NOT NULL,
      reference_type VARCHAR(50),
      reference_id INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_encashments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
      days_encashed INTEGER NOT NULL,
      amount_paid NUMERIC(12, 2) NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING',
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holiday_regions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(30) DEFAULT 'PUBLIC',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS optional_holiday_selections (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      holiday_id INTEGER NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, holiday_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id),
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50) NOT NULL,
      details TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payrolls (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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
      payment_status VARCHAR(30) DEFAULT 'PENDING',
      payment_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS salary_components (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(150) NOT NULL,
      type VARCHAR(30) NOT NULL, -- 'EARNING' | 'DEDUCTION'
      calculation_type VARCHAR(30) NOT NULL, -- 'FIXED' | 'PERCENTAGE'
      default_value NUMERIC(12, 2) DEFAULT 0.00,
      is_taxable BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) UNIQUE NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_template_components (
      id SERIAL PRIMARY KEY,
      template_id INTEGER NOT NULL REFERENCES salary_templates(id) ON DELETE CASCADE,
      component_id INTEGER NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
      formula_or_percentage TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_salary_assignments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      template_id INTEGER REFERENCES salary_templates(id) ON DELETE SET NULL,
      ctc_amount NUMERIC(12, 2) NOT NULL,
      effective_from DATE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_revisions (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      previous_ctc NUMERIC(12, 2) NOT NULL,
      revised_ctc NUMERIC(12, 2) NOT NULL,
      increment_percentage NUMERIC(5, 2) NOT NULL,
      effective_date DATE NOT NULL,
      approved_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_bank_details (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
      bank_name VARCHAR(150) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      ifsc_code VARCHAR(30) NOT NULL,
      branch_name VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_runs (
      id SERIAL PRIMARY KEY,
      run_code VARCHAR(50) UNIQUE NOT NULL,
      month VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      total_employees INTEGER DEFAULT 0,
      total_gross NUMERIC(12, 2) DEFAULT 0.00,
      total_net NUMERIC(12, 2) DEFAULT 0.00,
      status VARCHAR(30) DEFAULT 'DRAFT', -- 'DRAFT' | 'PREVIEW' | 'APPROVED' | 'PAID'
      processed_by INTEGER REFERENCES employees(id),
      processed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_run_items (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      gross_earnings NUMERIC(12, 2) NOT NULL,
      total_deductions NUMERIC(12, 2) NOT NULL,
      net_salary NUMERIC(12, 2) NOT NULL,
      payslip_json TEXT, -- detailed component breakdown
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_approvals (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      approver_id INTEGER NOT NULL REFERENCES employees(id),
      status VARCHAR(30) NOT NULL,
      comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payslip_documents (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      month VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      file_url TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS project_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      role_in_project VARCHAR(50) DEFAULT 'MEMBER',
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS project_members_v2 (
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
      progress_pct INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_work_updates (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      work_completed TEXT NOT NULL,
      hours_worked NUMERIC(5, 2) NOT NULL,
      progress_pct INTEGER NOT NULL,
      blockers TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_standups (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      standup_date DATE NOT NULL,
      yesterday_work TEXT NOT NULL,
      today_plan TEXT NOT NULL,
      blockers TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, standup_date)
    );

    CREATE TABLE IF NOT EXISTS recruitments (
      id SERIAL PRIMARY KEY,
      job_title VARCHAR(255) NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      openings INTEGER NOT NULL DEFAULT 1,
      experience_required VARCHAR(100),
      salary_range VARCHAR(100),
      status VARCHAR(50) DEFAULT 'OPEN',
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
      status VARCHAR(30) DEFAULT 'ASSIGNED',
      is_acknowledged BOOLEAN DEFAULT false,
      acknowledged_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_transfers (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      from_employee_id INTEGER REFERENCES employees(id),
      to_employee_id INTEGER NOT NULL REFERENCES employees(id),
      transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
      reason TEXT NOT NULL,
      transferred_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_issues (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      reported_by INTEGER NOT NULL REFERENCES employees(id),
      issue_type VARCHAR(50) DEFAULT 'DAMAGE',
      description TEXT NOT NULL,
      severity VARCHAR(30) DEFAULT 'MEDIUM',
      status VARCHAR(30) DEFAULT 'OPEN',
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_requests (
      id SERIAL PRIMARY KEY,
      request_number VARCHAR(50) UNIQUE NOT NULL,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      category VARCHAR(100) NOT NULL,
      request_type VARCHAR(50) DEFAULT 'NEW_ASSET',
      reason TEXT NOT NULL,
      priority VARCHAR(30) DEFAULT 'NORMAL',
      required_date DATE,
      status VARCHAR(30) DEFAULT 'SUBMITTED',
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
      status VARCHAR(30) DEFAULT 'APPROVED',
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

    CREATE TABLE IF NOT EXISTS payroll_settings (
      id SERIAL PRIMARY KEY,
      pay_cycle_start_day INTEGER NOT NULL DEFAULT 1,
      pay_disbursement_day INTEGER NOT NULL DEFAULT 30,
      tax_regime VARCHAR(30) DEFAULT 'NEW',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      status VARCHAR(30) DEFAULT 'SUBMITTED',
      approved_by INTEGER REFERENCES employees(id),
      reimbursed_amount NUMERIC(12, 2),
      payment_status VARCHAR(30) DEFAULT 'PENDING',
      payment_reference VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_advances (
      id SERIAL PRIMARY KEY,
      advance_number VARCHAR(50) NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      advance_amount NUMERIC(12, 2) NOT NULL,
      purpose TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING_APPROVAL',
      settled_amount NUMERIC(12, 2) DEFAULT 0,
      is_settled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(30) DEFAULT 'INFO', -- 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_devices (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      device_token TEXT NOT NULL,
      device_type VARCHAR(20) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, device_token)
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
      email_leaves BOOLEAN DEFAULT true,
      email_payroll BOOLEAN DEFAULT true,
      email_expenses BOOLEAN DEFAULT true,
      push_announcements BOOLEAN DEFAULT true,
      push_tickets BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_config (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'MAIN',
      company_name VARCHAR(255) NOT NULL,
      shift_start_time VARCHAR(5) DEFAULT '09:00',
      shift_end_time VARCHAR(5) DEFAULT '18:00',
      grace_minutes INTEGER DEFAULT 15,
      half_day_threshold_time VARCHAR(5) DEFAULT '13:00',
      auto_deduct_leave_for_two_half_days BOOLEAN DEFAULT true,
      currency VARCHAR(10) DEFAULT 'INR',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS geofence_settings (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'HQ',
      office_name VARCHAR(150) NOT NULL,
      latitude NUMERIC(10, 6) NOT NULL,
      longitude NUMERIC(10, 6) NOT NULL,
      radius_meters INTEGER NOT NULL DEFAULT 500,
      enforce_strict_geofence BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_url TEXT NOT NULL,
      version VARCHAR(50) DEFAULT '1.0',
      uploaded_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_url TEXT NOT NULL,
      expiry_date DATE,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS helpdesk_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      department_id INTEGER REFERENCES departments(id),
      default_assignee_id INTEGER REFERENCES employees(id),
      default_priority VARCHAR(20) DEFAULT 'MEDIUM',
      is_active BOOLEAN DEFAULT true,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_sla_rules (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      priority VARCHAR(20) NOT NULL,
      response_time_hours INTEGER NOT NULL,
      resolution_time_hours INTEGER NOT NULL,
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

    CREATE TABLE IF NOT EXISTS ticket_attachments (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_type VARCHAR(50),
      file_size_bytes INTEGER DEFAULT 0,
      uploaded_by INTEGER NOT NULL REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_watchers (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      added_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ticket_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS ticket_tags (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
      tag_name VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_activity_log (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
      actor_id INTEGER NOT NULL REFERENCES employees(id),
      action_type VARCHAR(50) NOT NULL,
      from_value VARCHAR(100),
      to_value VARCHAR(100),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_satisfaction_ratings (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE UNIQUE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS helpdesk_knowledge_base (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category_id INTEGER REFERENCES helpdesk_categories(id),
      tags TEXT,
      views_count INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES employees(id),
      updated_by INTEGER REFERENCES employees(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS helpdesk_canned_responses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      response_text TEXT NOT NULL,
      category VARCHAR(50),
      shortcut_code VARCHAR(50) UNIQUE,
      usage_count INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES employees(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_refresh_tokens (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      is_revoked BOOLEAN DEFAULT false,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS education (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      institution VARCHAR(255) NOT NULL,
      degree VARCHAR(100) NOT NULL,
      field_of_study VARCHAR(100),
      start_date DATE,
      end_date DATE,
      grade VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experience (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      company_name VARCHAR(255) NOT NULL,
      designation VARCHAR(150) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create View for backward compatibility with 'leaves'
    CREATE OR REPLACE VIEW leaves AS SELECT * FROM leave_applications;

    -- Performance optimization indexes
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
    CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_emp ON helpdesk_tickets(employee_id);
    CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON helpdesk_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_assigned ON helpdesk_tickets(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_daily_standups_date ON daily_standups(standup_date);
    CREATE INDEX IF NOT EXISTS idx_daily_standups_emp ON daily_standups(employee_id);
  `);
}
