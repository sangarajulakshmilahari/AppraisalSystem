-- User/role data updates requested on 2026-07-28
-- DB: appraisal_db
-- Scope: Lakshmi + Mounika only (Lahari user not present)
-- This version uses exact full names. If your username values differ,
-- first run the lookup query below and replace the strings.

-- Lookup first (read-only):
-- SELECT id, username, email
-- FROM appraisal_db.users
-- WHERE LOWER(username) IN (
--   LOWER('Lakshmi Sangaraju'),
--   LOWER('Mounika Kupuganti')
-- )
--    OR LOWER(username) LIKE 'lakshmi%'
--    OR LOWER(username) LIKE 'mounika%'
-- ;

START TRANSACTION;

-- 1) Resolve required role IDs
SET @employee_role_id := (
  SELECT role_id FROM appraisal_db.roles WHERE role_name = 'Employee' LIMIT 1
);
SET @manager_role_id := (
  SELECT role_id FROM appraisal_db.roles WHERE role_name = 'Manager' LIMIT 1
);

-- 2) Resolve requested users by exact name (edit text if needed)
SET @lakshmi_user_id := (
  SELECT id FROM appraisal_db.users WHERE LOWER(username) = LOWER('Lakshmi Sangaraju') LIMIT 1
);
SET @mounika_user_id := (
  SELECT id FROM appraisal_db.users WHERE LOWER(username) = LOWER('Mounika Kupuganti') LIMIT 1
);

-- 3) Lakshmi => only Employee role
DELETE FROM appraisal_db.user_roles
WHERE user_id = @lakshmi_user_id
  AND role_id <> @employee_role_id;

INSERT INTO appraisal_db.user_roles (user_id, role_id, assigned_at)
SELECT @lakshmi_user_id, @employee_role_id, NOW()
FROM DUAL
WHERE @lakshmi_user_id IS NOT NULL
  AND @employee_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM appraisal_db.user_roles ur
    WHERE ur.user_id = @lakshmi_user_id
      AND ur.role_id = @employee_role_id
  );

-- 4) Mounika => only Manager role
DELETE FROM appraisal_db.user_roles
WHERE user_id = @mounika_user_id
  AND role_id <> @manager_role_id;

INSERT INTO appraisal_db.user_roles (user_id, role_id, assigned_at)
SELECT @mounika_user_id, @manager_role_id, NOW()
FROM DUAL
WHERE @mounika_user_id IS NOT NULL
  AND @manager_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM appraisal_db.user_roles ur
    WHERE ur.user_id = @mounika_user_id
      AND ur.role_id = @manager_role_id
  );

COMMIT;

-- 6) Verification
SELECT u.id, u.username, r.role_name
FROM appraisal_db.user_roles ur
JOIN appraisal_db.users u ON u.id = ur.user_id
JOIN appraisal_db.roles r ON r.role_id = ur.role_id
WHERE u.id IN (@lakshmi_user_id, @mounika_user_id)
ORDER BY u.username, r.role_name;

SELECT ea.id, ea.employee_id, eu.username AS employee_name, ea.manager_id, mu.username AS manager_name, ea.cycle_id
FROM appraisal_db.employee_appraisals ea
LEFT JOIN appraisal_db.users eu ON eu.id = ea.employee_id
LEFT JOIN appraisal_db.users mu ON mu.id = ea.manager_id
WHERE ea.employee_id = @mounika_user_id
ORDER BY ea.id DESC;

