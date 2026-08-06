import { dbConnectionV2 } from './connection.js';

export async function initializeViews(): Promise<void> {
  const viewsSQL = `
  -- Active Employees Directory View
  CREATE OR REPLACE VIEW v_active_employees AS
  SELECT 
    e.id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.email,
    e.phone,
    e.role,
    e.joining_date,
    e.status,
    e.salary_amount,
    d.name AS department_name,
    d.code AS department_code,
    des.title AS designation_title,
    b.name AS branch_name,
    b.code AS branch_code,
    m.first_name || ' ' || m.last_name AS manager_name
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
  LEFT JOIN designations des ON e.designation_id = des.id
  LEFT JOIN branches b ON e.branch_id = b.id
  LEFT JOIN employees m ON e.manager_id = m.id
  WHERE e.deleted_at IS NULL AND e.status = 'ACTIVE';

  -- Leave Balance & Usage Overview View
  CREATE OR REPLACE VIEW v_leave_balance_overview AS
  SELECT 
    lb.id,
    lb.employee_id,
    e.employee_code,
    e.first_name || ' ' || e.last_name AS employee_name,
    lt.name AS leave_type_name,
    lt.code AS leave_type_code,
    lt.color,
    lb.total_allocated,
    lb.used_days,
    lb.remaining_days,
    lb.year
  FROM leave_balances lb
  JOIN employees e ON lb.employee_id = e.id
  JOIN leave_types lt ON lb.leave_type_id = lt.id
  WHERE lb.deleted_at IS NULL AND e.deleted_at IS NULL;

  -- Monthly Attendance Summary View
  CREATE OR REPLACE VIEW v_attendance_summary AS
  SELECT 
    a.employee_id,
    e.employee_code,
    e.first_name || ' ' || e.last_name AS employee_name,
    COUNT(a.id) AS total_days_recorded,
    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS days_present,
    SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS days_absent,
    SUM(CASE WHEN a.status = 'ON_LEAVE' THEN 1 ELSE 0 END) AS days_on_leave,
    SUM(a.total_hours) AS total_hours_worked,
    AVG(a.total_hours) AS avg_daily_hours
  FROM attendance a
  JOIN employees e ON a.employee_id = e.id
  WHERE a.deleted_at IS NULL
  GROUP BY a.employee_id, e.employee_code, e.first_name, e.last_name;

  -- Monthly Payroll Executive Summary View
  CREATE OR REPLACE VIEW v_monthly_payroll_summary AS
  SELECT 
    p.year,
    p.month,
    d.name AS department_name,
    b.name AS branch_name,
    COUNT(p.id) AS employee_count,
    SUM(p.gross_earnings) AS total_gross_payout,
    SUM(p.net_salary) AS total_net_payout,
    SUM(p.pf_deduction + p.tax_deduction) AS total_deductions
  FROM payroll p
  JOIN employees e ON p.employee_id = e.id
  LEFT JOIN departments d ON e.department_id = d.id
  LEFT JOIN branches b ON e.branch_id = b.id
  WHERE p.deleted_at IS NULL
  GROUP BY p.year, p.month, d.name, b.name;

  -- Department Headcount View
  CREATE OR REPLACE VIEW v_department_headcount AS
  SELECT 
    d.id AS department_id,
    d.name AS department_name,
    b.name AS branch_name,
    COUNT(e.id) AS total_headcount,
    SUM(CASE WHEN e.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_headcount,
    SUM(e.salary_amount) AS total_monthly_payroll_expense
  FROM departments d
  LEFT JOIN branches b ON d.branch_id = b.id
  LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
  WHERE d.deleted_at IS NULL
  GROUP BY d.id, d.name, b.name;
  `;

  await dbConnectionV2.query(viewsSQL);
}
