// app/api/lib/getProjectRole.ts
import { getPool } from "./db";

// We can use getPool (appraisal_db) with cross-database queries since same server
// OR use getAaramPool for direct L_db queries

export async function getProjectRole(keycloakId: string) {
  const pool = getPool();

  // Step 1: Find employee in L_db by keycloak_id
  const [empRows] = await pool.query(
    "SELECT id, employee_id, name, email, designation, role FROM L_db.employee WHERE keycloak_id = ?",
    [keycloakId]
  );

  if ((empRows as any[]).length === 0) {
    return { employee: null, projectRole: null, designation: null };
  }

  const employee = (empRows as any[])[0];

  // Step 1.1: Resolve reporting manager (if mapped in L_db), then map to appraisal_db user id
  let managerUserId: number | null = null;
  try {
    const [reportingRows] = await pool.query(
      `SELECT erm.manager_id, m.role AS manager_role
       FROM L_db.employee_reporting_managers erm
       JOIN L_db.employee m ON m.id = erm.manager_id
       WHERE erm.employee_id = ?
       ORDER BY CASE
         WHEN LOWER(m.role) = 'r_manager' THEN 0
         WHEN LOWER(m.role) = 'manager' THEN 1
         ELSE 2
       END,
       erm.manager_id
       LIMIT 1`,
      [employee.id]
    );

    const reporting = (reportingRows as any[])[0];
    if (reporting) {
      const managerEmployeeId = reporting.manager_id ?? null;

      if (managerEmployeeId) {
        const [managerEmpRows] = await pool.query(
          "SELECT keycloak_id FROM L_db.employee WHERE id = ? LIMIT 1",
          [managerEmployeeId]
        );
        const managerKeycloakId = (managerEmpRows as any[])[0]?.keycloak_id;

        if (managerKeycloakId) {
          const [managerUserRows] = await pool.query(
            "SELECT id FROM appraisal_db.users WHERE keycloak_id = ? LIMIT 1",
            [managerKeycloakId]
          );
          managerUserId = (managerUserRows as any[])[0]?.id ?? null;
        }
      }
    }
  } catch {
    // Keep nullable fallback when mapping table/columns are not available.
    managerUserId = null;
  }

  // Step 2: Do NOT query project_role from employee_project_assignment.
  // Some environments don't have that column/table shape, which caused runtime 500 errors.
  // Use employee.designation as the role-like source when designation mapping is needed.
  const projectRole: string | null = employee.designation ?? null;

  // Step 3: Map role-like value to kpi_designations
  let designation = null;
  if (projectRole) {
    // Try exact match first
    const [desRows] = await pool.query(
      "SELECT id, designation_name FROM appraisal_db.kpi_designations WHERE LOWER(designation_name) = LOWER(?) AND is_active = TRUE",
      [projectRole]
    );

    if ((desRows as any[]).length > 0) {
      designation = (desRows as any[])[0];
    } else {
      // Try partial match (e.g., "Developer" → "Developers")
      const [fuzzyRows] = await pool.query(
        "SELECT id, designation_name FROM appraisal_db.kpi_designations WHERE LOWER(designation_name) LIKE CONCAT('%', LOWER(?), '%') AND is_active = TRUE",
        [projectRole]
      );
      if ((fuzzyRows as any[]).length > 0) {
        designation = (fuzzyRows as any[])[0];
      }
    }
  }

  return {
    employee: {
      aaramId: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
      email: employee.email,
      aaramDesignation: employee.designation,
      aaramRole: employee.role,
      managerUserId,
    },
    projectRole,
    designation,
  };
}
