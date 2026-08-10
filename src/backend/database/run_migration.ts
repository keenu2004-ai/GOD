import db from './db.js';
import { initializeSchema } from './schema.js';
import { seedDatabase } from './seed.js';

(async () => {
  const tables = [
    'shifts', 'employee_shift_assignments', 'shift_swap_requests', 'overtime_requests',
    'performance_reviews', 'asset_inventory_audits', 'asset_audit_findings',
    'asset_depreciation_schedules', 'asset_maintenance', 'asset_warranty_claims',
    'asset_damage_investigations', 'asset_payroll_recoveries', 'active_work_timers',
    'time_entries', 'timesheet_approvals', 'timesheets', 'employee_resignations',
    'exit_department_clearances', 'expense_policy_rules', 'expense_risk_flags',
    'expense_budgets', 'expense_reconciliations', 'expense_period_locks',
    'salary_certificates', 'bonus_master', 'employee_bonuses', 'employee_incentives',
    'payroll_budgets', 'salary_component_master', 'employee_loans', 'employee_salary_advances',
    'project_sprints', 'task_checklists', 'project_work_updates', 'task_activity_feed',
    'task_comments', 'attendance_shifts', 'weekly_plans', 'weekly_plan_items',
    'weekly_planners', 'project_milestones', 'project_risks', 'client_organizations',
    'client_users', 'client_project_access', 'project_deliverables', 'project_change_requests',
    'project_clients', 'project_documents'
  ];

  console.log('[Migration] Dropping obsolete tables...');
  for (const t of tables) {
    try {
      await db.query('DROP TABLE IF EXISTS ' + t + ' CASCADE');
    } catch (e: any) {
      console.warn(`Warning dropping table ${t}:`, e.message);
    }
  }

  try {
    await db.query('ALTER TABLE expenses DROP COLUMN IF EXISTS policy_warning CASCADE');
  } catch (e: any) {
    console.warn('Warning dropping column policy_warning:', e.message);
  }

  console.log('[Migration] All deleted tables and columns dropped.');
  
  console.log('[Migration] Initializing schema...');
  await initializeSchema();
  console.log('[Migration] Schema initialized.');

  console.log('[Migration] Truncating employees for re-seeding...');
  try {
    await db.query('TRUNCATE TABLE employees CASCADE');
    await seedDatabase();
    console.log('[Migration] Database successfully re-seeded.');
  } catch (e: any) {
    console.error('Error seeding database:', e.message);
  }

  await db.close();
  console.log('[Migration] Migration complete.');
  process.exit(0);
})();
