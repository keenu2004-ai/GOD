import dbService from './db.js';

export async function initializeSchema() {
  await dbService.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
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
      reason TEXT NOT NULL,
      emergency_contact VARCHAR(50),
      attachment_url TEXT,
      status VARCHAR(30) DEFAULT 'MANAGER_PENDING',
      approver_id INTEGER REFERENCES employees(id),
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    CREATE TABLE IF NOT EXISTS holidays (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id),
      name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(50) DEFAULT 'NATIONAL',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      payment_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      receipt_url TEXT,
      status VARCHAR(20) DEFAULT 'PENDING',
      approved_by INTEGER REFERENCES employees(id),
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
