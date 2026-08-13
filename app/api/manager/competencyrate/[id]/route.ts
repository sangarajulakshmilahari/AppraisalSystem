// app/api/manager/competency-rate/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

const TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS = [
  "team_lead_feedback",
  "teamlead_feedback",
  "lead_feedback",
  "reviewer_feedback",
] as const;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Resolve competency + appraisal owner first
    const [rows] = await pool.query(
      `SELECT ec.id, ea.employee_id FROM employee_competencies ec
       JOIN employee_appraisals ea ON ec.appraisal_id = ea.id
       WHERE ec.id = ?`,
      [id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const compRow = (rows as any[])[0];

    // Verify current reviewer owns this employee in AARAM mapping.
    const [managerRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );
    const managerKeycloakId = (managerRows as any[])[0]?.keycloak_id as string | undefined;

    const [employeeRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [compRow.employee_id]
    );
    const employeeKeycloakId = (employeeRows as any[])[0]?.keycloak_id as string | undefined;

    if (!managerKeycloakId || !employeeKeycloakId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [mapRows] = await pool.query(
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
      [employeeKeycloakId, managerKeycloakId]
    );

    if ((mapRows as any[]).length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { manager_rating, manager_feedback } = body;

    if (manager_rating !== null && manager_rating !== undefined && (manager_rating < 1 || manager_rating > 5)) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const [reviewerRoleRows] = await pool.query(
      "SELECT role FROM aaram_db.employee WHERE keycloak_id = ? LIMIT 1",
      [managerKeycloakId]
    );
    const reviewerAaramRole = String((reviewerRoleRows as any[])[0]?.role || "").toLowerCase();
    const isTeamLeadReviewer = reviewerAaramRole === "manager";

    const ratingValue = manager_rating ?? null;
    const feedbackValue = manager_feedback ?? null;

    if (isTeamLeadReviewer) {
      const [feedbackColumnRows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'employee_competencies'
           AND COLUMN_NAME IN (${TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS.map(() => "?").join(", ")})`,
        [...TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS]
      );
      const availableFeedbackCols = new Set((feedbackColumnRows as any[]).map((r) => String(r.COLUMN_NAME)));
      const detectedFeedbackCol = TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS.find((c) => availableFeedbackCols.has(c));

      if (detectedFeedbackCol) {
        await pool.query(
          `UPDATE employee_competencies
           SET team_lead_rating = ?, ${detectedFeedbackCol} = ?
           WHERE id = ?`,
          [ratingValue, feedbackValue, id]
        );
      } else {
        await pool.query(
          "UPDATE employee_competencies SET team_lead_rating = ? WHERE id = ?",
          [ratingValue, id]
        );
      }
    } else {
      await pool.query(
        "UPDATE employee_competencies SET manager_rating = ?, manager_feedback = ? WHERE id = ?",
        [ratingValue, feedbackValue, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/manager/competencyrate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
