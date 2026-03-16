// app/api/lib/getUser.ts
import { cookies } from "next/headers";
import { getPool } from "./db";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const keycloakId = cookieStore.get("keycloak_id")?.value;
  const sessionUser = cookieStore.get("user")?.value
    ? decodeURIComponent(cookieStore.get("user")!.value)
    : null;

  const pool = getPool();
  let userRow: any = null;

  if (keycloakId) {
    const [rows] = await pool.query(
      "SELECT id, keycloak_id, username, email FROM users WHERE keycloak_id = ?",
      [keycloakId]
    );
    const users = rows as any[];
    if (users.length > 0) userRow = users[0];
  }

  if (!userRow && sessionUser) {
    const [rows] = await pool.query(
      "SELECT id, keycloak_id, username, email FROM users WHERE username = ? OR email = ?",
      [sessionUser, sessionUser]
    );
    const users = rows as any[];
    if (users.length > 0) userRow = users[0];
  }

  return userRow; // { id, keycloak_id, username, email } or null
}

/**
 * Get or create the employee_appraisals row for the active cycle.
 * Returns the appraisal row or null if no active cycle exists.
 */
export async function getActiveAppraisal(userId: number) {
  const pool = getPool();

  // Find active cycle
  const [cycles] = await pool.query(
    "SELECT * FROM appraisal_cycles WHERE is_active = TRUE LIMIT 1"
  );
  const cycle = (cycles as any[])[0];
  if (!cycle) return null;

  // Find or create employee_appraisals row
  const [existing] = await pool.query(
    "SELECT * FROM employee_appraisals WHERE cycle_id = ? AND employee_id = ?",
    [cycle.id, userId]
  );

  if ((existing as any[]).length > 0) {
    return { cycle, appraisal: (existing as any[])[0] };
  }

  // Auto-create appraisal row for this employee + cycle
  const [result] = await pool.query(
    `INSERT INTO employee_appraisals (cycle_id, employee_id, current_phase)
     VALUES (?, ?, 'goal_setting')`,
    [cycle.id, userId]
  );

  const [newRow] = await pool.query(
    "SELECT * FROM employee_appraisals WHERE id = ?",
    [(result as any).insertId]
  );

  return { cycle, appraisal: (newRow as any[])[0] };
}