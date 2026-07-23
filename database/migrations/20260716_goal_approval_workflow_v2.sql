-- Update columns for goal approval workflow (checking if they exist first)
-- 1. Ensure created_by has correct ENUM type
-- 2. Ensure other columns exist with correct types

-- Check and modify created_by column
SET @dbname = DATABASE();
SET @tablename = "employee_goals";
SET @columnname = "created_by";

SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = @columnname;

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE employee_goals MODIFY COLUMN created_by ENUM(\'employee\', \'manager\') DEFAULT \'employee\';',
  'ALTER TABLE employee_goals ADD COLUMN created_by ENUM(\'employee\', \'manager\') DEFAULT \'employee\' AFTER is_custom;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add/modify rejection_reason
SET @columnname = "rejection_reason";
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = @columnname;

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE employee_goals MODIFY COLUMN rejection_reason TEXT NULL AFTER status;',
  'ALTER TABLE employee_goals ADD COLUMN rejection_reason TEXT NULL AFTER status;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add/modify modified_by
SET @columnname = "modified_by";
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = @columnname;

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE employee_goals MODIFY COLUMN modified_by INT NULL AFTER rejection_reason;',
  'ALTER TABLE employee_goals ADD COLUMN modified_by INT NULL AFTER rejection_reason;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add/modify modified_at
SET @columnname = "modified_at";
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = @columnname;

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE employee_goals MODIFY COLUMN modified_at TIMESTAMP NULL AFTER modified_by;',
  'ALTER TABLE employee_goals ADD COLUMN modified_at TIMESTAMP NULL AFTER modified_by;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add/modify reviewed_by
SET @columnname = "reviewed_by";
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = @columnname;

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE employee_goals MODIFY COLUMN reviewed_by INT NULL AFTER modified_at;',
  'ALTER TABLE employee_goals ADD COLUMN reviewed_by INT NULL AFTER modified_at;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add/modify reviewed_at
SET @columnname = "reviewed_at";
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = @columnname;

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE employee_goals MODIFY COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;',
  'ALTER TABLE employee_goals ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
ALTER TABLE employee_goals
  ADD INDEX IF NOT EXISTS idx_employee_goals_created_by (created_by),
  ADD INDEX IF NOT EXISTS idx_employee_goals_status_reviewed (status, reviewed_at);

-- Update existing template goals to have created_by = 'manager'
UPDATE employee_goals 
SET created_by = 'manager' 
WHERE is_custom = 0 AND created_by = 'employee';

-- Update existing custom goals to have created_by = 'employee' (if not set)
UPDATE employee_goals 
SET created_by = 'employee' 
WHERE is_custom = 1 AND (created_by IS NULL OR created_by = '');