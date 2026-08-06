import { dbConnectionV2 } from './connection.js';

export async function initializeConstraints(): Promise<void> {
  const constraintSQL = `
  DO $$ BEGIN
    -- Employee check constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employee_salary') THEN
      ALTER TABLE employees ADD CONSTRAINT chk_employee_salary CHECK (salary_amount >= 0);
    END IF;

    -- Attendance constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_attendance_hours') THEN
      ALTER TABLE attendance ADD CONSTRAINT chk_attendance_hours CHECK (total_hours >= 0 AND break_hours >= 0 AND overtime_hours >= 0);
    END IF;

    -- Leave request date validation
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leave_dates') THEN
      ALTER TABLE leave_requests ADD CONSTRAINT chk_leave_dates CHECK (end_date >= start_date);
    END IF;

    -- Leave balance non-negative
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leave_balance_nonnegative') THEN
      ALTER TABLE leave_balances ADD CONSTRAINT chk_leave_balance_nonnegative CHECK (remaining_days >= 0);
    END IF;

    -- Expense positive amount
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_expense_amount') THEN
      ALTER TABLE expenses ADD CONSTRAINT chk_expense_amount CHECK (amount > 0);
    END IF;

    -- Salary structure basic pay positive
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_salary_basic') THEN
      ALTER TABLE salary_structures ADD CONSTRAINT chk_salary_basic CHECK (basic_salary >= 0 AND gross_salary >= basic_salary);
    END IF;

    -- Performance rating range
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_review_rating') THEN
      ALTER TABLE performance_reviews ADD CONSTRAINT chk_review_rating CHECK (rating >= 0.0 AND rating <= 5.0);
    END IF;

    -- Goal percentage range
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goal_progress') THEN
      ALTER TABLE goals ADD CONSTRAINT chk_goal_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
    END IF;

  END $$;
  `;

  await dbConnectionV2.query(constraintSQL);
}
