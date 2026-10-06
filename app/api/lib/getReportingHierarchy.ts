import type { Pool, RowDataPacket } from "mysql2/promise";

export type HierarchyPerson = {
  aaramEmployeeId: number;
  employeeCode: string;
  name: string;
  email: string | null;
  role: string | null;
  designation: string | null;
  region: string | null;
  keycloakId: string | null;
  userId: number | null;
};

type EmployeeRow = RowDataPacket & {
  id: number;
  employee_id: string;
  name: string;
  email: string | null;
  role: string | null;
  designation: string | null;
  region: string | null;
  keycloak_id: string | null;
  reporting_manager_id: number | null;
  user_id: number | null;
};

const PERSON_SELECT = `m.id, m.employee_id, m.name, m.email, m.role, m.designation, m.region, m.keycloak_id, m.reporting_manager_id, u.id AS user_id`;

function mapPerson(row: EmployeeRow): HierarchyPerson {
  return {
    aaramEmployeeId: row.id,
    employeeCode: row.employee_id,
    name: row.name,
    email: row.email,
    role: row.role,
    designation: row.designation,
    region: row.region,
    keycloakId: row.keycloak_id,
    userId: row.user_id ?? null,
  };
}

function normalizeRole(role: string | null | undefined): string {
  return (role || "").trim().toLowerCase();
}

async function loadPersonByAaramId(pool: Pool, aaramId: number): Promise<HierarchyPerson | null> {
  const [rows] = await pool.query<EmployeeRow[]>(
    `SELECT ${PERSON_SELECT}
     FROM L_db.employee m
     LEFT JOIN appraisal_db.users u ON u.keycloak_id = m.keycloak_id
     WHERE m.id = ?
     LIMIT 1`,
    [aaramId]
  );
  return rows[0] ? mapPerson(rows[0]) : null;
}

async function loadPersonByUserId(pool: Pool, userId: number): Promise<HierarchyPerson | null> {
  const [rows] = await pool.query<EmployeeRow[]>(
    `SELECT ${PERSON_SELECT}
     FROM appraisal_db.users u
     JOIN L_db.employee m ON m.keycloak_id = u.keycloak_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] ? mapPerson(rows[0]) : null;
}

async function findRManagerUpChain(pool: Pool, startAaramEmployeeId: number): Promise<HierarchyPerson | null> {
  const [rows] = await pool.query<EmployeeRow[]>(
    `WITH RECURSIVE reporting_chain AS (
       SELECT erm.employee_id AS origin_id, erm.manager_id, 1 AS lvl
       FROM L_db.employee_reporting_managers erm
       WHERE erm.employee_id = ?
       UNION ALL
       SELECT rc.origin_id, erm.manager_id, rc.lvl + 1
       FROM reporting_chain rc
       JOIN L_db.employee_reporting_managers erm ON erm.employee_id = rc.manager_id
       WHERE rc.lvl < 6
     )
     SELECT ${PERSON_SELECT}
     FROM reporting_chain rc
     JOIN L_db.employee m ON m.id = rc.manager_id
     LEFT JOIN appraisal_db.users u ON u.keycloak_id = m.keycloak_id
     WHERE LOWER(COALESCE(m.role, '')) = 'r_manager'
       AND m.id <> ?
     ORDER BY rc.lvl, m.id
     LIMIT 1`,
    [startAaramEmployeeId, startAaramEmployeeId]
  );
  return rows[0] ? mapPerson(rows[0]) : null;
}

/**
 * Resolves Team Lead and Manager from the existing AARAM hierarchy.
 * Business mapping (same as profile / user role mapping):
 * - L_db.employee.role = 'Manager'   => Team Lead
 * - L_db.employee.role = 'R_Manager' => Manager
 *
 * Uses L_db.employee_reporting_managers first, then reporting_manager_id,
 * then walks the reporting chain for a missing R_Manager.
 */
export async function getReportingHierarchy(
  pool: Pool,
  employeeKeycloakId: string,
  fallbackManagerUserId?: number | null
): Promise<{
  employee: HierarchyPerson | null;
  teamLead: HierarchyPerson | null;
  manager: HierarchyPerson | null;
}> {
  const [empRows] = await pool.query<EmployeeRow[]>(
    `SELECT e.id, e.employee_id, e.name, e.email, e.role, e.designation, e.region,
            e.keycloak_id, e.reporting_manager_id, u.id AS user_id
     FROM L_db.employee e
     LEFT JOIN appraisal_db.users u ON u.keycloak_id = e.keycloak_id
     WHERE e.keycloak_id = ?
     LIMIT 1`,
    [employeeKeycloakId]
  );

  const employeeRow = empRows[0];
  if (!employeeRow) {
    return { employee: null, teamLead: null, manager: null };
  }

  const employee = mapPerson(employeeRow);

  const [directRows] = await pool.query<EmployeeRow[]>(
    `SELECT ${PERSON_SELECT}
     FROM L_db.employee_reporting_managers erm
     JOIN L_db.employee m ON m.id = erm.manager_id
     LEFT JOIN appraisal_db.users u ON u.keycloak_id = m.keycloak_id
     WHERE erm.employee_id = ?
     ORDER BY CASE
       WHEN LOWER(m.role) = 'manager' THEN 0
       WHEN LOWER(m.role) = 'r_manager' THEN 1
       ELSE 2
     END, m.id`,
    [employee.aaramEmployeeId]
  );

  let teamLead: HierarchyPerson | null = null;
  let manager: HierarchyPerson | null = null;

  for (const row of directRows) {
    const person = mapPerson(row);
    const role = normalizeRole(person.role);
    if (role === "manager" && !teamLead) teamLead = person;
    if (role === "r_manager" && !manager) manager = person;
  }

  if (!teamLead && !manager && employeeRow.reporting_manager_id) {
    const fallbackDirect = await loadPersonByAaramId(pool, employeeRow.reporting_manager_id);
    if (fallbackDirect) {
      const role = normalizeRole(fallbackDirect.role);
      if (role === "r_manager") manager = fallbackDirect;
      else teamLead = fallbackDirect;
    }
  }

  if (!manager) {
    const startId = teamLead?.aaramEmployeeId ?? employee.aaramEmployeeId;
    manager = await findRManagerUpChain(pool, startId);
  }

  if (!manager && fallbackManagerUserId) {
    manager = await loadPersonByUserId(pool, fallbackManagerUserId);
  }

  return { employee, teamLead, manager };
}

export function uniqueReviewers(teamLead: HierarchyPerson | null, manager: HierarchyPerson | null): HierarchyPerson[] {
  const people = [teamLead, manager].filter((person): person is HierarchyPerson => !!person);
  const seen = new Set<string>();
  const unique: HierarchyPerson[] = [];

  for (const person of people) {
    const key = `a:${person.aaramEmployeeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(person);
  }

  return unique;
}
