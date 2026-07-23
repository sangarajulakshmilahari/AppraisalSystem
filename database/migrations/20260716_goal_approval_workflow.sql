-- Add columns for goal approval workflow
-- 1. Track who created the goal (employee or manager)
-- 2. Track rejection reason
-- 3. Track who modified rejected goals
-- 4. Add 'modified' status

ALTER TABLE employee_goals
  ADD COLUMN created_by ENUM('employee', 'manager') DEFAULT 'employee' AFTER is_custom,
  ADD COLUMN rejection_reason TEXT NULL AFTER status,
  ADD COLUMN modified_by INT NULL AFTER rejection_reason,
  ADD COLUMN modified_at TIMESTAMP NULL AFTER modified_by,
  ADD COLUMN reviewed_by INT NULL AFTER modified_at,
  ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;

-- Update existing goals to have created_by = 'employee' (default)
-- Update existing goals to have created_by = 'manager' for goals created by manager (if we can identify them)

-- Add foreign key constraints (optional)
-- ALTER TABLE employee_goals
--   ADD CONSTRAINT fk_employee_goals_modified_by FOREIGN KEY (modified_by) REFERENCES users(id),
--   ADD CONSTRAINT fk_employee_goals_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);

-- Add index for faster queries
ALTER TABLE employee_goals
  ADD INDEX idx_employee_goals_created_by (created_by),
  ADD INDEX idx_employee_goals_status_reviewed (status, reviewed_at);