import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/getuser";

type AppraisalRow = RowDataPacket & {
  id: number;
  employee_id: number;
  manager_id: number;
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ appraisalId: string }> }) {
  try {
    const { appraisalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    const [rows] = await pool.query<AppraisalRow[]>(
      "SELECT id, employee_id, manager_id FROM employee_appraisals WHERE id = ?",
      [appraisalId],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const appraisal = rows[0];

    // Verify current reviewer owns this employee in AARAM mapping.
    const [managerRows] = await pool.query<RowDataPacket[]>(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [user.id],
    );
    const managerKeycloakId = (managerRows as any[])[0]?.keycloak_id as string | undefined;

    const [employeeRows] = await pool.query<RowDataPacket[]>(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [appraisal.employee_id],
    );
    const employeeKeycloakId = (employeeRows as any[])[0]?.keycloak_id as string | undefined;

    if (!managerKeycloakId || !employeeKeycloakId) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const [mapRows] = await pool.query<RowDataPacket[]>(
      `WITH RECURSIVE reporting_chain AS (
         SELECT erm.employee_id, erm.manager_id, 1 AS lvl
         FROM aaram_db.employee_reporting_managers erm
         UNION ALL
         SELECT rc.employee_id, erm.manager_id, rc.lvl + 1
         FROM reporting_chain rc
         JOIN aaram_db.employee_reporting_managers erm ON erm.employee_id = rc.manager_id
         WHERE rc.lvl < 6
       )
       SELECT 1
       FROM reporting_chain rc
       JOIN aaram_db.employee e ON e.id = rc.employee_id
       JOIN aaram_db.employee m ON m.id = rc.manager_id
       WHERE e.keycloak_id = ? AND m.keycloak_id = ?
       LIMIT 1`,
      [employeeKeycloakId, managerKeycloakId],
    );

    if ((mapRows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES (?, 'Development Plan Approved', ?, 'success', '/webpage/employee/development-plan')`,
      [
        appraisal.employee_id,
        `Your manager ${user.username} has reviewed and approved your development plan.`,
      ],
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/manager/development-plans/approve/[appraisalId] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

