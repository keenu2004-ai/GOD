import dbService from './db.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    const check = await dbService.query('SELECT COUNT(*) as count FROM employees');
    const count = parseInt((check.rows[0] as any)?.count || '0', 10);
    if (count > 0) {
      console.log(`[PostgreSQL Seed] Database already seeded with ${count} employees.`);
      return;
    }
  } catch (e) {
    console.log('[PostgreSQL Seed] Employees table check, proceeding with initial seed...');
  }

  console.log('[PostgreSQL Seed] Seeding enterprise database for THEIAKSHI ENTERPRISES...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Helper for resilient query execution
  const safeQuery = async (label: string, sql: string, params: any[] = []) => {
    try {
      await dbService.query(sql, params);
    } catch (err: any) {
      console.warn(`[PostgreSQL Seed Warning] ${label}:`, err.message);
    }
  };

  // 1. Branches
  await safeQuery('Branches', `
    INSERT INTO branches (id, name, code, city, state, country, timezone, address, latitude, longitude, geofence_radius_meters, is_headquarters) VALUES
    (1, 'THEIAKSHI HQ - Bengaluru', 'THK-BLR', 'Bengaluru', 'Karnataka', 'India', 'Asia/Kolkata', 'Embassy TechVillage, Outer Ring Road, Bengaluru, Karnataka 560103', 12.9279, 77.6892, 500, true),
    (2, 'THEIAKSHI Tech Hub - Hyderabad', 'THK-HYD', 'Hyderabad', 'Telangana', 'India', 'Asia/Kolkata', 'HITEC City, Phase II, Madhapur, Hyderabad, Telangana 500081', 17.4483, 78.3741, 500, false),
    (3, 'THEIAKSHI North Zone - Gurgaon', 'THK-GGN', 'Gurgaon', 'Haryana', 'India', 'Asia/Kolkata', 'Cyber City, DLF Phase 2, Gurgaon, Haryana 122002', 28.4950, 77.0895, 500, false)
    ON CONFLICT (code) DO NOTHING;
  `);

  // 2. Departments
  await safeQuery('Departments', `
    INSERT INTO departments (id, name, code) VALUES
    (1, 'Executive Leadership', 'EXEC'),
    (2, 'Engineering & Technology', 'ENG'),
    (3, 'Human Resources', 'HR'),
    (4, 'Finance & Accounts', 'FIN'),
    (5, 'Product Management', 'PROD'),
    (6, 'Sales & Enterprise Marketing', 'SLS'),
    (7, 'IT Operations & Infrastructure', 'IT')
    ON CONFLICT (code) DO NOTHING;
  `);

  // 3. Roles
  await safeQuery('Roles', `
    INSERT INTO roles (id, name, description) VALUES
    (1, 'ADMIN', 'System Administrator with full enterprise privileges'),
    (2, 'HR_MANAGER', 'Human Resource Manager with payroll, recruitment, and employee privileges'),
    (3, 'DEPT_HEAD', 'Department Head with approval and project management privileges'),
    (4, 'EMPLOYEE', 'Standard Employee user access')
    ON CONFLICT (name) DO NOTHING;
  `);

  // 4. Leave Types
  await safeQuery('Leave Types', `
    INSERT INTO leave_types (id, name, code, color, days_allowed, is_carry_forward) VALUES
    (1, 'Casual Leave', 'CL', '#3B82F6', 12, false),
    (2, 'Sick Leave', 'SL', '#EF4444', 10, true),
    (3, 'Privilege/Earned Leave', 'PL', '#10B981', 18, true),
    (4, 'Maternity/Paternity Leave', 'ML', '#8B5CF6', 90, false),
    (5, 'Compensatory Off', 'COMP', '#F59E0B', 6, false)
    ON CONFLICT (code) DO NOTHING;
  `);

  // 5. Employees
  await safeQuery('Employees', `
    INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, password_hash, role, department_id, branch_id, designation, joining_date, salary, bank_account, ifsc_code, pan_number, aadhaar_number, emergency_contact_name, emergency_contact_phone, reporting_manager_id, avatar_url, status) VALUES
    (1, 'THK001', 'Vaibhav', 'Arya', 'admin@theiakshi.com', '+91 9876543210', $1, 'ADMIN', 1, 1, 'Chief Executive Officer', '2021-01-15', 250000.00, '918237192837', 'HDFC0001234', 'ABCDE1234F', '123456789012', 'Priya Arya', '+91 9876543211', NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', 'ACTIVE'),
    (2, 'THK002', 'Ananya', 'Sharma', 'ananya.sharma@theiakshi.com', '+91 9876543212', $1, 'HR_MANAGER', 3, 1, 'Head of Human Resources', '2021-03-01', 140000.00, '918237192838', 'ICIC0005678', 'BCDEF2345G', '234567890123', 'Rajesh Sharma', '+91 9876543213', 1, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250', 'ACTIVE'),
    (3, 'THK003', 'Rohan', 'Verma', 'rohan.verma@theiakshi.com', '+91 9876543214', $1, 'DEPT_HEAD', 2, 1, 'VP of Engineering', '2021-06-15', 180000.00, '918237192839', 'SBIN0009101', 'CDEFG3456H', '345678901234', 'Sunita Verma', '+91 9876543215', 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250', 'ACTIVE'),
    (4, 'THK004', 'Kavya', 'Reddy', 'kavya.reddy@theiakshi.com', '+91 9876543216', $1, 'EMPLOYEE', 2, 2, 'Senior Full Stack Engineer', '2022-02-10', 95000.00, '918237192840', 'HDFC0001234', 'DEFGH4567I', '456789012345', 'Venkatesh Reddy', '+91 9876543217', 3, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250', 'ACTIVE'),
    (5, 'THK005', 'Vikram', 'Malhotra', 'vikram.m@theiakshi.com', '+91 9876543218', $1, 'EMPLOYEE', 4, 3, 'Senior Finance Lead', '2022-05-20', 110000.00, '918237192841', 'UTIB0003456', 'EFGHI5678J', '567890123456', 'Sanjay Malhotra', '+91 9876543219', 1, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250', 'ACTIVE'),
    (6, 'THK006', 'Sneha', 'Gupta', 'sneha.gupta@theiakshi.com', '+91 9876543220', $1, 'EMPLOYEE', 5, 1, 'Lead Product Designer', '2023-01-10', 88000.00, '918237192842', 'HDFC0001234', 'FGHIJ6789K', '678901234567', 'Alok Gupta', '+91 9876543221', 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', 'ACTIVE')
    ON CONFLICT (employee_code) DO NOTHING;
  `, [passwordHash]);

  // Department Heads
  await safeQuery('Dept Heads', `
    UPDATE departments SET head_employee_id = 1 WHERE id = 1;
    UPDATE departments SET head_employee_id = 3 WHERE id = 2;
    UPDATE departments SET head_employee_id = 2 WHERE id = 3;
    UPDATE departments SET head_employee_id = 5 WHERE id = 4;
  `);

  // 6. Leave Balances
  await safeQuery('Leave Balances', `
    INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used_days, remaining_days) VALUES
    (1, 1, 12, 2, 10), (1, 2, 10, 1, 9), (1, 3, 18, 4, 14),
    (2, 1, 12, 3, 9),  (2, 2, 10, 0, 10), (2, 3, 18, 2, 16),
    (3, 1, 12, 1, 11), (3, 2, 10, 2, 8),  (3, 3, 18, 5, 13),
    (4, 1, 12, 4, 8),  (4, 2, 10, 1, 9),  (4, 3, 18, 3, 15),
    (5, 1, 12, 2, 10), (5, 2, 10, 0, 10), (5, 3, 18, 1, 17),
    (6, 1, 12, 0, 12), (6, 2, 10, 1, 9),  (6, 3, 18, 2, 16)
    ON CONFLICT (employee_id, leave_type_id) DO NOTHING;
  `);

  // 7. Holidays
  await safeQuery('Holidays', `
    INSERT INTO holidays (branch_id, name, date, type, is_active) VALUES
    (1, 'Independence Day', '2026-08-15', 'NATIONAL', true),
    (1, 'Ganesh Chaturthi', '2026-09-14', 'FESTIVAL', true),
    (1, 'Gandhi Jayanti', '2026-10-02', 'NATIONAL', true),
    (1, 'Diwali / Deepavali', '2026-11-08', 'FESTIVAL', true);
  `);

  // 8. Attendance Records
  const today = new Date().toISOString().split('T')[0];
  await safeQuery('Attendance', `
    INSERT INTO attendance (employee_id, date, punch_in, punch_out, punch_in_lat, punch_in_lng, work_hours, break_duration_mins, shift_name, is_late, is_overtime, status) VALUES
    (1, '${today}', '${today} 08:55:00', NULL, 12.9279, 77.6892, 4.5, 30, 'General Shift (9 AM - 6 PM)', false, false, 'PRESENT'),
    (2, '${today}', '${today} 09:12:00', NULL, 12.9280, 77.6891, 4.2, 15, 'General Shift (9 AM - 6 PM)', true, false, 'LATE'),
    (3, '${today}', '${today} 08:50:00', NULL, 12.9278, 77.6893, 4.6, 20, 'General Shift (9 AM - 6 PM)', false, false, 'PRESENT'),
    (4, '${today}', '${today} 09:02:00', NULL, 17.4483, 78.3741, 4.4, 15, 'General Shift (9 AM - 6 PM)', false, false, 'PRESENT'),
    (5, '${today}', '${today} 08:45:00', NULL, 28.4950, 77.0895, 4.7, 30, 'General Shift (9 AM - 6 PM)', false, false, 'PRESENT'),
    (6, '${today}', NULL, NULL, NULL, NULL, 0, 0, 'General Shift (9 AM - 6 PM)', false, false, 'ON_LEAVE');
  `);

  // 9. Leave Applications
  await safeQuery('Leave Applications', `
    INSERT INTO leave_applications (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id) VALUES
    (6, 1, '${today}', '${today}', 1, 'Attending family function', 'APPROVED', 2),
    (4, 2, '2026-08-12', '2026-08-13', 2, 'Doctor consultation and medical checkup', 'MANAGER_PENDING', NULL),
    (5, 3, '2026-08-20', '2026-08-22', 3, 'Annual vacation', 'APPROVED', 1);
  `);

  // 10. Payroll
  await safeQuery('Payroll', `
    INSERT INTO payrolls (employee_id, month, year, basic_salary, hra, conveyance, allowances, gross_salary, pf_deduction, esi_deduction, tds_deduction, net_salary, payment_status, payment_date) VALUES
    (1, 'July', 2026, 125000.00, 62500.00, 25000.00, 37500.00, 250000.00, 15000.00, 0.00, 35000.00, 200000.00, 'PAID', '2026-07-31'),
    (2, 'July', 2026, 70000.00, 35000.00, 14000.00, 21000.00, 140000.00, 8400.00, 0.00, 15600.00, 116000.00, 'PAID', '2026-07-31'),
    (3, 'July', 2026, 90000.00, 45000.00, 18000.00, 27000.00, 180000.00, 10800.00, 0.00, 23200.00, 146000.00, 'PAID', '2026-07-31'),
    (4, 'July', 2026, 47500.00, 23750.00, 9500.00, 14250.00, 95000.00, 5700.00, 0.00, 8300.00, 81000.00, 'PAID', '2026-07-31'),
    (5, 'July', 2026, 55000.00, 27500.00, 11000.00, 16500.00, 110000.00, 6600.00, 0.00, 10400.00, 93000.00, 'PAID', '2026-07-31'),
    (6, 'July', 2026, 44000.00, 22000.00, 8800.00, 13200.00, 88000.00, 5280.00, 0.00, 6720.00, 76000.00, 'PAID', '2026-07-31');
  `);

  // 11. Expenses
  await safeQuery('Expenses', `
    INSERT INTO expenses (employee_id, title, category, amount, date, description, status, approved_by) VALUES
    (4, 'Bengaluru Client Meeting Taxi Fare', 'TRAVEL', 1450.00, '2026-08-01', 'Uber rides for on-site client architecture discussion', 'APPROVED', 3),
    (3, 'Cloud Infrastructure Certification Voucher', 'SOFTWARE', 18500.00, '2026-08-02', 'AWS Certified Solutions Architect Professional exam', 'APPROVED', 1),
    (2, 'Quarterly HR Offsite Team Lunch', 'MEALS', 8200.00, '2026-08-03', 'Lunch meeting with HR leadership team', 'PENDING', NULL);
  `);

  // 12. Projects & Members & Tasks
  await safeQuery('Projects', `
    INSERT INTO projects (id, name, code, description, client_name, start_date, end_date, budget, status, progress) VALUES
    (1, 'THEIAKSHI Cloud HR Core Platform', 'PRJ-HRCore', 'Enterprise HR Platform with real-time biometric tracking and automated payroll calculation.', 'Internal Enterprise', '2026-01-01', '2026-12-31', 5000000.00, 'IN_PROGRESS', 72),
    (2, 'Aura Banking Portal Modernization', 'PRJ-AuraBank', 'Next-gen customer portal for Aura Global Bank with high-security OAuth and micro-services.', 'Aura Global Bank', '2026-03-15', '2026-10-30', 12000000.00, 'IN_PROGRESS', 58),
    (3, 'OmniHealth AI Telemedicine Suite', 'PRJ-OmniHealth', 'HIPAA-compliant telemedicine app integrated with AI diagnostics.', 'OmniHealth Care', '2026-05-01', '2026-11-15', 8500000.00, 'PLANNING', 25)
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO project_members (project_id, employee_id, role) VALUES
    (1, 3, 'PROJECT_LEAD'), (1, 4, 'SENIOR_ENGINEER'), (1, 6, 'UI_UX_DESIGNER'),
    (2, 3, 'TECH_ARCHITECT'), (2, 4, 'FULL_STACK_DEV')
    ON CONFLICT (project_id, employee_id) DO NOTHING;

    INSERT INTO tasks (project_id, title, description, assigned_to, due_date, priority, status) VALUES
    (1, 'Implement Geofence GPS Punch API', 'Build high-accuracy radius validation endpoint for mobile punches', 4, '2026-08-10', 'HIGH', 'IN_PROGRESS'),
    (1, 'Design Payroll Payslip PDF Exporter', 'Create clean PDF layout for monthly salary breakdown', 6, '2026-08-12', 'MEDIUM', 'TODO'),
    (2, 'Integrate OAuth 2.0 Security Flow', 'Build secure JWT token rotation and session management', 4, '2026-08-15', 'CRITICAL', 'IN_PROGRESS');
  `);

  // 13. Recruitment & Candidates
  await safeQuery('Recruitments', `
    INSERT INTO recruitments (id, job_title, department_id, openings, experience_required, salary_range, status) VALUES
    (1, 'Senior Backend Engineer (Node.js/PostgreSQL)', 2, 3, '5-8 Years', '₹18,000,00 - ₹28,000,00 LPA', 'OPEN'),
    (2, 'Lead HR Business Partner', 3, 1, '6-10 Years', '₹15,000,00 - ₹22,000,00 LPA', 'OPEN'),
    (3, 'Senior DevOps Engineer (Kubernetes/AWS)', 7, 2, '4-7 Years', '₹20,000,00 - ₹30,000,00 LPA', 'OPEN');

    INSERT INTO candidates (recruitment_id, candidate_name, email, phone, status, interview_date, feedback) VALUES
    (1, 'Aarav Mehta', 'aarav.m@gmail.com', '+91 9988776655', 'INTERVIEW_SCHEDULED', '2026-08-08 11:00:00', 'Passed initial technical screening with top rating'),
    (1, 'Diya Nair', 'diya.nair@outlook.com', '+91 9877665544', 'SHORTLISTED', NULL, 'Strong system design experience with high-scale DBs'),
    (2, 'Karan Kapoor', 'karan.k@yahoo.com', '+91 9766554433', 'OFFERED', '2026-08-02 14:00:00', 'Offered role, awaiting candidate signature');
  `);

  // 14. Assets
  await safeQuery('Assets', `
    INSERT INTO assets (asset_name, asset_code, category, serial_number, assigned_to_employee_id, purchase_date, value, status) VALUES
    ('MacBook Pro M3 Max 16"', 'AST-MBP-001', 'Laptop', 'C02G1234MD6R', 1, '2024-01-15', 320000.00, 'ALLOCATED'),
    ('MacBook Pro M3 Pro 14"', 'AST-MBP-002', 'Laptop', 'C02G5678MD6S', 3, '2024-02-01', 240000.00, 'ALLOCATED'),
    ('Dell UltraSharp 32" 4K Monitor', 'AST-MON-001', 'Display', 'CN01234567890', 4, '2024-03-10', 65000.00, 'ALLOCATED'),
    ('Ergonomic Mesh Chair', 'AST-CHR-001', 'Furniture', 'FUR-98765', 2, '2024-01-20', 28000.00, 'ALLOCATED')
    ON CONFLICT (asset_code) DO NOTHING;
  `);

  // 15. Notifications
  await safeQuery('Notifications', `
    INSERT INTO notifications (employee_id, title, message, type, is_read) VALUES
    (1, 'Executive Morning Brief', 'Today: 5 Employees present, 1 on leave, 1 pending expense approval', 'INFO', false),
    (4, 'Expense Approved', 'Your travel expense claim #1 for ₹1,450.00 was approved by Rohan Verma', 'SUCCESS', false),
    (2, 'New Leave Application', 'Kavya Reddy submitted a Sick Leave request for Aug 12 - Aug 13', 'WARNING', false);
  `);

  // 16. Announcements
  await safeQuery('Announcements', `
    INSERT INTO announcements (title, content, category, is_pinned, posted_by) VALUES
    ('THEIAKSHI ENTERPRISES Q3 Townhall Meeting', 'Dear Team, We are thrilled to invite everyone to our Q3 All-Hands Townhall meeting this Friday at 3:00 PM IST in the Main Auditorium & online via Meet. We will unveil new employee growth initiatives!', 'EVENT', true, 1),
    ('Updated Health Insurance Policy 2026', 'Our corporate health cover has been upgraded to include wellness allowances, OPD coverage up to ₹25,000, and immediate family rider options. Please check the Documents section.', 'POLICY', false, 2);
  `);

  // 17. Celebrations
  await safeQuery('Celebrations', `
    INSERT INTO celebrations (employee_id, type, event_date, title, message) VALUES
    (4, 'BIRTHDAY', '2026-08-08', 'Happy Birthday Kavya Reddy!', 'Wishing you a fantastic year filled with success, happiness, and great code!'),
    (3, 'WORK_ANNIVERSARY', '2026-08-15', '5 Years at THEIAKSHI ENTERPRISES', 'Celebrating 5 incredible years of engineering leadership with Rohan Verma!');
  `);

  // 18. Helpdesk Tickets
  await safeQuery('Helpdesk Tickets', `
    INSERT INTO helpdesk_tickets (ticket_code, employee_id, category, subject, description, priority, status, assigned_to) VALUES
    ('TKT-8901', 4, 'HARDWARE', 'Request for Secondary Monitor Adapter', 'Need a DisplayPort to USB-C 4K adapter for laptop workstation setup.', 'MEDIUM', 'OPEN', 3),
    ('TKT-8902', 6, 'SOFTWARE', 'Figma Enterprise License Allocation', 'Requesting seat assignment on THEIAKSHI Figma design team workspace.', 'HIGH', 'RESOLVED', 3)
    ON CONFLICT (ticket_code) DO NOTHING;
  `);

  // 19. Performance Reviews
  await safeQuery('Performance Reviews', `
    INSERT INTO performance_reviews (employee_id, reviewer_id, review_period, rating, feedback, goals) VALUES
    (4, 3, 'H1 2026', 4.8, 'Kavya has shown outstanding technical execution in delivery of backend microservices and architecture lead.', 'Lead mobile app modularization and mentor junior engineers.'),
    (6, 3, 'H1 2026', 4.6, 'Sneha delivered pristine UI design systems for THEIAKSHI ONE product experience.', 'Create unified design system documentation and accessibility standards.');
  `);

  // 20. Weekly Planners
  await safeQuery('Weekly Planners', `
    INSERT INTO weekly_planners (employee_id, week_start_date, title, description, priority, status) VALUES
    (1, '2026-08-03', 'Finalize Q3 Strategic Growth Plan', 'Review branch performance and authorize new tech hiring budgets', 'HIGH', 'IN_PROGRESS'),
    (2, '2026-08-03', 'Complete Monthly Payroll Audit', 'Verify TDS compliance and disburse August salary slips', 'HIGH', 'IN_PROGRESS'),
    (4, '2026-08-03', 'Ship Geofence Punch & Leave APIs', 'Test end-to-end REST endpoints with unit validation', 'CRITICAL', 'DONE');
  `);

  // 21. System Config & Geofence Settings
  await safeQuery('System Config', `
    INSERT INTO system_config (id, company_name, shift_start_time, shift_end_time, grace_minutes, half_day_threshold_time, auto_deduct_leave_for_two_half_days, currency) VALUES
    ('MAIN', 'THEIAKSHI ENTERPRISES', '09:00', '18:00', 15, '11:30', true, 'INR')
    ON CONFLICT (id) DO NOTHING;
  `);

  await safeQuery('Geofence Settings', `
    INSERT INTO geofence_settings (id, office_name, latitude, longitude, radius_meters, enforce_strict_geofence) VALUES
    ('HQ', 'THEIAKSHI HQ - Bengaluru', 12.9716, 77.5946, 500, true)
    ON CONFLICT (id) DO NOTHING;
  `);

  await safeQuery('Audit Logs', `
    INSERT INTO audit_logs (employee_id, action, module, details, ip_address) VALUES
    (1, 'SYSTEM_INIT', 'SYSTEM', 'System configuration and database schema initialized', '127.0.0.1'),
    (2, 'LEAVE_APPROVAL', 'LEAVE', 'Approved 1 day casual leave for Sneha Gupta', '192.168.1.105');
  `);

  // 22. Reset PostgreSQL Serial Sequences
  await safeQuery('Reset Sequences', `
    SELECT setval(pg_get_serial_sequence('branches', 'id'), COALESCE((SELECT MAX(id) FROM branches), 1));
    SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1));
    SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));
    SELECT setval(pg_get_serial_sequence('leave_types', 'id'), COALESCE((SELECT MAX(id) FROM leave_types), 1));
    SELECT setval(pg_get_serial_sequence('employees', 'id'), COALESCE((SELECT MAX(id) FROM employees), 1));
    SELECT setval(pg_get_serial_sequence('projects', 'id'), COALESCE((SELECT MAX(id) FROM projects), 1));
  `);

  console.log('[PostgreSQL Seed] Seeding completed successfully.');
}
