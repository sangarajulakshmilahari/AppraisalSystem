// app/api/manager/review-goal/[goalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

const TEAM_LEAD_FEEDBACK_COLUMNS = [
  "team_lead_feedback",
  "teamlead_feedback",
  "lead_feedback",
  "reviewer_feedback",
] as const;

const TEAM_LEAD_RATING_COLUMNS = [
  "team_lead_rating",
  "teamlead_rating",
  "lead_rating",
  "reviewer_rating",
] as const;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const { goalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Resolve goal + appraisal first
    const [rows] = await pool.query(
      `SELECT eg.id, ea.employee_id
       FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND eg.is_deleted = 0`,
      [goalId]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found or not your team member" }, { status: 404 });
    }

    const goalRow = (rows as any[])[0];

    // Verify this goal's employee is under current reviewer in AARAM mapping.
    const [managerRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );
    const managerKeycloakId = (managerRows as any[])[0]?.keycloak_id as string | undefined;

    const [employeeRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [goalRow.employee_id]
    );
    const employeeKeycloakId = (employeeRows as any[])[0]?.keycloak_id as string | undefined;

    if (!managerKeycloakId || !employeeKeycloakId) {
      return NextResponse.json({ error: "Goal not found or not your team member" }, { status: 404 });
    }

    const [mapRows] = await pool.query(
      `WITH RECURSIVE reporting_chain AS (
         SELECT erm.employee_id, erm.manager_id, 1 AS lvl
         FROM L_db.employee_reporting_managers erm
         UNION ALL
         SELECT rc.employee_id, erm.manager_id, rc.lvl + 1
         FROM reporting_chain rc
         JOIN L_db.employee_reporting_managers erm ON erm.employee_id = rc.manager_id
         WHERE rc.lvl < 6
       )
       SELECT 1
       FROM reporting_chain rc
       JOIN L_db.employee e ON e.id = rc.employee_id
       JOIN L_db.employee m ON m.id = rc.manager_id
       WHERE e.keycloak_id = ? AND m.keycloak_id = ?
       LIMIT 1`,
      [employeeKeycloakId, managerKeycloakId]
    );

    if ((mapRows as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found or not your team member" }, { status: 404 });
    }

    const body = await req.json();
    const { manager_feedback, performance_rating } = body;

    if (performance_rating !== null && performance_rating !== undefined && (performance_rating < 1 || performance_rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // If current reviewer is Team Lead (aaram role = 'Manager'),
    // save text into team-lead feedback column instead of manager_feedback.
    const [reviewerRoleRows] = await pool.query(
      "SELECT role FROM L_db.employee WHERE keycloak_id = ? LIMIT 1",
      [managerKeycloakId]
    );
    const reviewerAaramRole = String((reviewerRoleRows as any[])[0]?.role || "").toLowerCase();

    const isTeamLeadReviewer = reviewerAaramRole === "manager";

    let feedbackColumn: string | null = "manager_feedback";
    let ratingColumn: string = "performance_rating";

    if (isTeamLeadReviewer) {
      const [teamLeadColumnRows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'employee_goals'
           AND COLUMN_NAME IN (${TEAM_LEAD_FEEDBACK_COLUMNS.map(() => "?").join(", ")})`,
        [...TEAM_LEAD_FEEDBACK_COLUMNS]
      );

      const available = new Set((teamLeadColumnRows as any[]).map((r) => String(r.COLUMN_NAME)));
      const detected = TEAM_LEAD_FEEDBACK_COLUMNS.find((c) => available.has(c));
      feedbackColumn = detected || null;

      const [teamLeadRatingRows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'employee_goals'
           AND COLUMN_NAME IN (${TEAM_LEAD_RATING_COLUMNS.map(() => "?").join(", ")})`,
        [...TEAM_LEAD_RATING_COLUMNS]
      );
      const availableRatingCols = new Set((teamLeadRatingRows as any[]).map((r) => String(r.COLUMN_NAME)));
      const detectedRatingCol = TEAM_LEAD_RATING_COLUMNS.find((c) => availableRatingCols.has(c));
      if (detectedRatingCol) ratingColumn = detectedRatingCol;
    }

    const feedbackValue = manager_feedback ?? null;
    const ratingValue = performance_rating ?? null;

    if (isTeamLeadReviewer) {
      const updates: string[] = [];
      const values: any[] = [];

      if (feedbackColumn) {
        updates.push(`${feedbackColumn} = ?`);
        values.push(feedbackValue);
      }

      updates.push(`${ratingColumn} = ?`);
      values.push(ratingValue);

      values.push(goalId);

      await pool.query(
        `UPDATE employee_goals SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    } else {
      await pool.query(
        "UPDATE employee_goals SET manager_feedback = ?, performance_rating = ? WHERE id = ?",
        [feedbackValue, ratingValue, goalId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/manager/review-goal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
