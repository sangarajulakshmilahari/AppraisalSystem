// app/api/lib/getTeam.ts
import { getPool } from "./db";
import type { ResultSetHeader } from "mysql2/promise";

type ManagerUserRow = {
  keycloak_id: string | null;
};

type ActiveCycleRow = {
  id: number;
};

type TeamMemberMapRow = {
  aaram_employee_id: number;
  keycloak_id: string | null;
  name: string;
  email: string;
  user_id: number | null;
};

type AppraisalUserIdRow = {
  id: number;
};

/**
 * Get all employee appraisals where the given user is the manager.
 * Returns appraisals with employee info for the active cycle.
 */
export async function getTeamAppraisals(managerId: number) {
  const pool = getPool();

  // 1) Resolve manager keycloak from appraisal_db.users
  const [managerRows] = await pool.query(
    "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
    [managerId]
  );
  const managerKeycloakId = (managerRows as ManagerUserRow[])[0]?.keycloak_id;
  if (!managerKeycloakId) return [];

  // 2) Resolve manager's AARAM employee id
  const [managerEmpRows] = await pool.query(
    "SELECT id FROM aaram_db.employee WHERE keycloak_id = ? LIMIT 1",
    [managerKeycloakId]
  );
  const managerAaramId = (managerEmpRows as { id: number }[])[0]?.id;
  if (!managerAaramId) return [];

  // 3) Active cycle (manager pages are active-cycle scoped)
  const [cycleRows] = await pool.query(
    "SELECT id FROM appraisal_cycles WHERE is_active = TRUE LIMIT 1"
  );
  const activeCycleId = (cycleRows as ActiveCycleRow[])[0]?.id;
  if (!activeCycleId) return [];

  // 4) Team from aaram mapping + optional existing appraisal user mapping
  const [teamRowsRaw] = await pool.query(
    `SELECT e.id AS aaram_employee_id,
            e.keycloak_id,
            e.name,
            e.email,
            u.id AS user_id
     FROM aaram_db.employee_reporting_managers erm
     JOIN aaram_db.employee e ON e.id = erm.employee_id
     LEFT JOIN appraisal_db.users u ON u.keycloak_id = e.keycloak_id
     WHERE erm.manager_id = ?
     ORDER BY e.name`,
    [managerAaramId]
  );
  const teamRows = teamRowsRaw as TeamMemberMapRow[];
  if (teamRows.length === 0) return [];

  // 5) Ensure each mapped subordinate exists in appraisal_db.users
  for (const member of teamRows) {
    if (member.user_id || !member.keycloak_id) continue;

    const [insertUser] = await pool.query<ResultSetHeader>(
      `INSERT INTO appraisal_db.users (keycloak_id, username, email, created_at)
       VALUES (?, ?, ?, NOW())`,
      [member.keycloak_id, member.name, member.email || member.name]
    );
    member.user_id = insertUser.insertId;
  }

  const subordinateUserIds = teamRows
    .map((m) => m.user_id)
    .filter((id): id is number => typeof id === "number" && id > 0);

  if (subordinateUserIds.length === 0) return [];

  // 6) Ensure appraisal rows exist for active cycle, so manager can see team immediately
  for (const employeeUserId of subordinateUserIds) {
    await pool.query(
      `INSERT INTO employee_appraisals (cycle_id, employee_id, manager_id, current_phase)
       SELECT ?, ?, ?, 'goal_setting'
       WHERE NOT EXISTS (
         SELECT 1
         FROM employee_appraisals
         WHERE cycle_id = ? AND employee_id = ?
       )`,
      [activeCycleId, employeeUserId, managerId, activeCycleId, employeeUserId]
    );
  }

  // 7) Return manager's active-cycle team appraisals
  const placeholders = subordinateUserIds.map(() => "?").join(", ");

  const [rows] = await pool.query(
    `SELECT ea.*, u.username AS employee_name, u.email AS employee_email,
            ac.cycle_name, ac.period_start, ac.period_end
     FROM employee_appraisals ea
     JOIN users u ON ea.employee_id = u.id
     JOIN appraisal_cycles ac ON ea.cycle_id = ac.id
     WHERE ea.cycle_id = ?
       AND ea.employee_id IN (${placeholders})
     ORDER BY u.username`,
    [activeCycleId, ...subordinateUserIds]
  );

  return rows as any[];
}
