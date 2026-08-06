import { dbConnectionV2 } from './connection.js';
import bcrypt from 'bcryptjs';

export async function seedEnterpriseDatabase(): Promise<void> {
  const checkSeeded = await dbConnectionV2.query(`SELECT COUNT(*) as cnt FROM roles`);
  const count = Number(checkSeeded.rows[0]?.cnt || 0);
  if (count > 0) {
    console.log('[DatabaseV2 Seeder] Database already populated. Skipping duplicate seed.');
    return;
  }

  console.log('[DatabaseV2 Seeder] Populating enterprise seed data...');

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Roles
  await dbConnectionV2.query(`
    INSERT INTO roles (name, code, description, is_system) VALUES
    ('Administrator', 'ADMIN', 'System super administrator with full system permissions', true),
    ('HR Manager', 'HR_MGR', 'Human Resources manager overseeing employees, payroll, and leave', true),
    ('Manager', 'MANAGER', 'People manager approving attendance, leave, and expenses', false),
    ('Employee', 'EMPLOYEE', 'Standard organization workforce member', false),
    ('Intern', 'INTERN', 'Trainee workforce member with restricted permissions', false);
  `);

  // 2. Branches
  await dbConnectionV2.query(`
    INSERT INTO branches (name, code, address, city, state, country, is_headquarters) VALUES
    ('THEIAKSHI HQ - Bengaluru', 'BLR_HQ', '100 Feet Road, Indiranagar', 'Bengaluru', 'Karnataka', 'India', true),
    ('THEIAKSHI Hub - Hyderabad', 'HYD_HUB', 'HITEC City, Phase 2', 'Hyderabad', 'Telangana', 'India', false),
    ('THEIAKSHI FinTech - Mumbai', 'BOM_HUB', 'Bandra Kurla Complex', 'Mumbai', 'Maharashtra', 'India', false);
  `);

  // 3. Departments
  await dbConnectionV2.query(`
    INSERT INTO departments (branch_id, name, code, description) VALUES
    (1, 'Engineering & Technology', 'ENG', 'Core software engineering and architecture division'),
    (1, 'Human Resources', 'HR', 'People management, recruiting, and culture'),
    (1, 'Finance & Accounting', 'FIN', 'Payroll, taxation, and budgeting'),
    (2, 'Operations & Logistics', 'OPS', 'Enterprise operational management'),
    (2, 'Sales & Marketing', 'SALES', 'Revenue generation and brand positioning'),
    (3, 'Customer Support', 'SUPP', 'Client happiness and technical support desk');
  `);

  // 4. Designations
  await dbConnectionV2.query(`
    INSERT INTO designations (department_id, title, code, grade_level) VALUES
    (1, 'Chief Technology Officer', 'CTO', 'EXEC_L1'),
    (1, 'Principal Software Architect', 'ARCH', 'ENG_L5'),
    (1, 'Senior Full Stack Engineer', 'SR_ENG', 'ENG_L3'),
    (2, 'Head of Human Resources', 'HR_HEAD', 'EXEC_L2'),
    (2, 'HR Business Partner', 'HRBP', 'HR_L3'),
    (3, 'Chief Financial Officer', 'CFO', 'EXEC_L1'),
    (4, 'Operations Manager', 'OPS_MGR', 'MGR_L2');
  `);

  // 5. Shifts
  await dbConnectionV2.query(`
    INSERT INTO shifts (name, code, start_time, end_time, grace_period_mins) VALUES
    ('General Morning Shift', 'GEN_SHIFT', '09:00:00', '18:00:00', 15),
    ('US Evening Shift', 'US_SHIFT', '18:00:00', '03:00:00', 15),
    ('Flexible Hours Shift', 'FLEX_SHIFT', '10:00:00', '19:00:00', 30);
  `);

  // 6. Leave Types & Policies
  await dbConnectionV2.query(`
    INSERT INTO leave_types (name, code, description, color, max_days_per_year, is_paid) VALUES
    ('Earned Leave', 'EL', 'Privilege Annual Paid Leave', '#3b82f6', 15.0, true),
    ('Casual Leave', 'CL', 'Unplanned Short Casual Absences', '#10b981', 12.0, true),
    ('Sick Leave', 'SL', 'Medical and Health Related Leave', '#f59e0b', 10.0, true),
    ('Maternity Leave', 'ML', 'Statutory Maternity Leave', '#ec4899', 180.0, true);

    INSERT INTO leave_policies (leave_type_id, carry_forward_limit, monthly_accrual_rate) VALUES
    (1, 10, 1.25),
    (2, 0, 1.00),
    (3, 5, 0.83),
    (4, 0, 0.00);
  `);

  // 7. Expense Categories
  await dbConnectionV2.query(`
    INSERT INTO expense_categories (name, code, description) VALUES
    ('Client Travel & Commute', 'TRAVEL', 'Flight, train, taxi, and local transit expenses'),
    ('Meals & Entertainment', 'MEALS', 'Business dining and team client meetings'),
    ('Internet & Utilities', 'UTIL', 'Home broadband and office utility reimbursements'),
    ('Software & Subscriptions', 'SW_SUB', 'Developer tools, SaaS licenses, and cloud services');
  `);

  // 8. Holidays
  await dbConnectionV2.query(`
    INSERT INTO holidays (branch_id, name, date, type) VALUES
    (1, 'New Year Day', '2026-01-01', 'MANDATORY'),
    (1, 'Republic Day', '2026-01-26', 'MANDATORY'),
    (1, 'Independence Day', '2026-08-15', 'MANDATORY'),
    (1, 'Gandhi Jayanti', '2026-10-02', 'MANDATORY'),
    (1, 'Diwali', '2026-11-08', 'MANDATORY');
  `);

  // 9. Demo Employees
  await dbConnectionV2.query(`
    INSERT INTO employees (
      employee_code, email, password_hash, first_name, last_name, phone, role, role_id,
      department_id, designation_id, branch_id, joining_date, salary_amount, status
    ) VALUES 
    ('EMP001', 'admin@theiakshi.com', '${passwordHash}', 'Vaibhav', 'Arya', '+91 98765 00001', 'Administrator', 1, 1, 1, 1, '2022-01-01', 250000.00, 'ACTIVE'),
    ('EMP002', 'hr@theiakshi.com', '${passwordHash}', 'Priya', 'Sharma', '+91 98765 00002', 'HR Manager', 2, 2, 4, 1, '2023-03-15', 120000.00, 'ACTIVE'),
    ('EMP003', 'manager@theiakshi.com', '${passwordHash}', 'Vikram', 'Rathore', '+91 98765 00003', 'Manager', 3, 1, 2, 1, '2023-06-01', 150000.00, 'ACTIVE'),
    ('EMP004', 'dev@theiakshi.com', '${passwordHash}', 'Rahul', 'Verma', '+91 98765 00004', 'Employee', 4, 1, 3, 2, '2024-01-10', 95000.00, 'ACTIVE'),
    ('EMP005', 'intern@theiakshi.com', '${passwordHash}', 'Ananya', 'Gupta', '+91 98765 00005', 'Intern', 5, 1, 3, 3, '2026-01-05', 25000.00, 'PROBATION');
  `);

  // Update manager IDs
  await dbConnectionV2.query(`
    UPDATE employees SET manager_id = 1 WHERE id IN (2, 3);
    UPDATE employees SET manager_id = 3 WHERE id IN (4, 5);
  `);

  // 10. Initial Leave Balances for Employees
  await dbConnectionV2.query(`
    INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used_days, remaining_days, year) VALUES
    (1, 1, 15, 2, 13, 2026), (1, 2, 12, 1, 11, 2026), (1, 3, 10, 0, 10, 2026),
    (2, 1, 15, 0, 15, 2026), (2, 2, 12, 3, 9, 2026),  (2, 3, 10, 1, 9, 2026),
    (3, 1, 15, 4, 11, 2026), (3, 2, 12, 2, 10, 2026), (3, 3, 10, 0, 10, 2026),
    (4, 1, 15, 1, 14, 2026), (4, 2, 12, 0, 12, 2026), (4, 3, 10, 2, 8, 2026),
    (5, 1, 5, 0, 5, 2026),   (5, 2, 5, 1, 4, 2026),   (5, 3, 5, 0, 5, 2026);
  `);

  // 11. Initial System Settings
  await dbConnectionV2.query(`
    INSERT INTO settings (key, value, category, description) VALUES
    ('COMPANY_NAME', 'THEIAKSHI ONE Enterprise HRMS', 'GENERAL', 'Legal organization identity name'),
    ('CURRENCY_SYMBOL', '₹', 'FINANCE', 'Primary system currency symbol'),
    ('DEFAULT_TIMEZONE', 'Asia/Kolkata', 'GENERAL', 'Default corporate operational timezone'),
    ('MAX_LEAVE_ACCUMULATION', '45', 'LEAVE', 'Maximum allowable leave carry forward days');
  `);

  console.log('[DatabaseV2 Seeder] Enterprise database seed sequence completed successfully.');
}
