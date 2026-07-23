// app/api/lib/getProjectRole.ts
import { getPool } from "./db";

// We can use getPool (appraisal_db) with cross-database queries since same server
// OR use getAaramPool for direct aaram_db queries

export async function getProjectRole(keycloakId: string) {
  const pool = getPool();

  // Step 1: Find employee in aaram_db by keycloak_id
  const [empRows] = await pool.query(
    "SELECT id, employee_id, name, email, designation, role FROM aaram_db.employee WHERE keycloak_id = ?",
    [keycloakId]
  );

  if ((empRows as any[]).length === 0) {
    return { employee: null, projectRole: null, designation: null };
  }

  const employee = (empRows as any[])[0];

  // Step 2: Get project_role from employee_project_assignment
  const [assignRows] = await pool.query(
    "SELECT project_role, project_id FROM aaram_db.employee_project_assignment WHERE employee_id = ? AND project_role IS NOT NULL LIMIT 1",
    [employee.id]
  );

  let projectRole: string | null = null;
  if ((assignRows as any[]).length > 0) {
    projectRole = (assignRows as any[])[0].project_role;
  }

  // Step 3: Map project_role to kpi_designations
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
    },
    projectRole,
    designation,
  };
}