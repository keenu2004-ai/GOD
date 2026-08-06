import { dbConnectionV2 } from './connection.js';

export async function initializeIndexes(): Promise<void> {
  const indexStatements = `
  -- Employee Primary Indexes & Partial Soft-Delete Indexes
  CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_employees_created ON employees(created_at);

  -- Attendance Indexes for Rapid Range & Date Lookups
  CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
  CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
  CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
  CREATE INDEX IF NOT EXISTS idx_attendance_logs_emp ON attendance_logs(employee_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_logs_punch ON attendance_logs(punch_time);

  -- Leave Management High Concurrency Indexes
  CREATE INDEX IF NOT EXISTS idx_leave_requests_emp ON leave_requests(employee_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_leave_balances_emp ON leave_balances(employee_id, year) WHERE deleted_at IS NULL;

  -- Payroll & Financial Lookups
  CREATE INDEX IF NOT EXISTS idx_payroll_emp ON payroll(employee_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON payroll(month, year);
  CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
  CREATE INDEX IF NOT EXISTS idx_salary_struct_emp ON salary_structures(employee_id) WHERE deleted_at IS NULL;

  -- Expenses & Approvals
  CREATE INDEX IF NOT EXISTS idx_expenses_emp ON expenses(employee_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_expenses_cat ON expenses(category_id);

  -- Organization Indexes
  CREATE INDEX IF NOT EXISTS idx_departments_branch ON departments(branch_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_designations_dept ON designations(department_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_holidays_branch ON holidays(branch_id, date) WHERE deleted_at IS NULL;

  -- Projects, Tasks, & Timesheets
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_timesheets_emp ON timesheets(employee_id, date) WHERE deleted_at IS NULL;

  -- Helpdesk & Recruitment
  CREATE INDEX IF NOT EXISTS idx_tickets_emp ON tickets(employee_id) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id) WHERE deleted_at IS NULL;

  -- System, Logs & AI
  CREATE INDEX IF NOT EXISTS idx_notifications_emp ON notifications(employee_id, is_read) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_audit_logs_emp ON audit_logs(employee_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_ai_logs_emp ON ai_logs(employee_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_emp ON activity_logs(employee_id, created_at);
  `;

  await dbConnectionV2.query(indexStatements);
}
