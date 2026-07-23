// app/api/lib/getUser.ts
import { cookies } from "next/headers";
import { getPool } from "./db";
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
    return { cycle, appraisal: existing[0] };
  }

  // Auto-create appraisal row for this employee + cycle
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO employee_appraisals (cycle_id, employee_id, current_phase)
     VALUES (?, ?, 'goal_setting')`,
    [cycle.id, userId]
  );

  const [newRow] = await pool.query<AppraisalRow[]>(
    "SELECT * FROM employee_appraisals WHERE id = ?",
    [result.insertId]
  );

  return { cycle, appraisal: newRow[0] };
}
