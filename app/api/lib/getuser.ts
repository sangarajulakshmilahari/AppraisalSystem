// app/api/lib/getUser.ts
import { cookies } from "next/headers";
import { getPool } from "./db";
import { getProjectRole } from "./getProjectRole";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

type CurrentUserRow = RowDataPacket & {
  id: number;
  keycloak_id: string;
  username: string;
  email: string;
};

type CycleRow = RowDataPacket & {
  id: number;
  is_active: number;
};

type AppraisalRow = RowDataPacket & {
  id: number;
  cycle_id: number;
  employee_id: number;
  current_phase: string;
  goal_count?: number;
};

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const keycloakId = cookieStore.get("keycloak_id")?.value;

  if (!keycloakId) return null;

  const pool = getPool();
  let userRow: CurrentUserRow | null = null;

  if (keycloakId) {
    const [rows] = await pool.query<CurrentUserRow[]>(
      "SELECT id, keycloak_id, username, email FROM users WHERE keycloak_id = ?",
      [keycloakId]
    );
    if (rows.length > 0) userRow = rows[0];
  }

  return userRow; // { id, keycloak_id, username, email } or null
}

export async function getActiveAppraisal(userId: number) {
  const pool = getPool();

  // Find active cycle
  const [cycles] = await pool.query<CycleRow[]>(
    "SELECT * FROM appraisal_cycles WHERE is_active = TRUE LIMIT 1"
  );
  const cycle = cycles[0];
  if (!cycle) return null;

  // Find or create employee_appraisals row
  const [existing] = await pool.query<AppraisalRow[]>(
    `SELECT ea.*, (
        SELECT COUNT(*)
        FROM employee_goals eg
        WHERE eg.appraisal_id = ea.id AND COALESCE(eg.is_deleted, 0) = 0
      ) AS goal_count
     FROM employee_appraisals ea
     WHERE ea.cycle_id = ? AND ea.employee_id = ?
     ORDER BY goal_count DESC, ea.id DESC`,
    [cycle.id, userId]
  );

  if (existing.length > 0) {
    const appraisal = existing[0] as any;

    // Backfill manager mapping for existing rows when missing.
    if (!appraisal.manager_id) {
      const [userRows] = await pool.query<RowDataPacket[]>(
        "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
        [userId]
      );
      const keycloakId = (userRows as any[])[0]?.keycloak_id as string | undefined;

      if (keycloakId) {
        const roleInfo = await getProjectRole(keycloakId);
        const managerUserId = roleInfo.employee?.managerUserId ?? null;
        if (managerUserId) {
          await pool.query(
            "UPDATE employee_appraisals SET manager_id = ? WHERE id = ?",
            [managerUserId, appraisal.id]
          );
          appraisal.manager_id = managerUserId;
        }
      }
    }

    return { cycle, appraisal };
  }

  let managerId: number | null = null;
  const [userRows] = await pool.query<RowDataPacket[]>(
    "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  const keycloakId = (userRows as any[])[0]?.keycloak_id as string | undefined;
  if (keycloakId) {
    const roleInfo = await getProjectRole(keycloakId);
    managerId = roleInfo.employee?.managerUserId ?? null;
  }

  // Auto-create appraisal row for this employee + cycle
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO employee_appraisals (cycle_id, employee_id, manager_id, current_phase)
     VALUES (?, ?, ?, 'goal_setting')`,
    [cycle.id, userId, managerId]
  );

  const [newRow] = await pool.query<AppraisalRow[]>(
    "SELECT * FROM employee_appraisals WHERE id = ?",
    [result.insertId]
  );

  return { cycle, appraisal: newRow[0] };
}
