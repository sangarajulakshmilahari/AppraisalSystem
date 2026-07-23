-- Final migration for goal approval workflow
-- All required columns already exist in the table
-- This migration ensures data consistency and adds indexes

-- 1. Update template goals to have created_by = 'manager'
UPDATE employee_goals 
SET created_by = 'manager' 
WHERE source = 'template' AND (created_by IS NULL OR created_by = 'employee');

-- 2. Update custom goals to have created_by = 'employee' (if not set)
UPDATE employee_goals 
SET created_by = 'employee' 
WHERE (source = 'custom' OR is_custom = 1) AND (created_by IS NULL OR created_by = '');

-- 3. Add indexes for better query performance (if they don't exist)
ALTER TABLE employee_goals
  ADD INDEX IF NOT EXISTS idx_employee_goals_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_employee_goals_status_reviewed (status, reviewed_at),
  ADD INDEX IF NOT EXISTS idx_employee_goals_appraisal_status (appraisal_id, status);

-- 4. Update any existing draft goals from manager to be reviewable
-- This ensures backward compatibility with existing data