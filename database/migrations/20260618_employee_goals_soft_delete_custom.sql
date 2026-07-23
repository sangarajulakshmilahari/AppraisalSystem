-- Adds soft-delete and custom-goal support for employee goals
ALTER TABLE employee_goals
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN is_custom TINYINT(1) NOT NULL DEFAULT 0 AFTER is_deleted;

-- Optional but recommended indexes for frequent filters
ALTER TABLE employee_goals
  ADD INDEX idx_employee_goals_appraisal_deleted (appraisal_id, is_deleted),
  ADD INDEX idx_employee_goals_appraisal_status_deleted (appraisal_id, status, is_deleted);
