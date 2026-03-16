// app/api/lib/getTeam.ts
import { getPool } from "./db";

/**
 * Get all employee appraisals where the given user is the manager.
 * Returns appraisals with employee info for the active cycle.
 */
export async function getTeamAppraisals(managerId: number) {
  const pool = getPool();

  const [rows] = await pool.query(
    `SELECT ea.*, u.username AS employee_name, u.email AS employee_email,
            ac.cycle_name, ac.period_start, ac.period_end
     FROM employee_appraisals ea
     JOIN users u ON ea.employee_id = u.id
     JOIN appraisal_cycles ac ON ea.cycle_id = ac.id
     WHERE ea.manager_id = ? AND ac.is_active = TRUE
     ORDER BY u.username`,
    [managerId]
  );

  return rows as any[];
}