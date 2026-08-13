// app/api/manager/complete-review/[appraisalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

const TEAM_LEAD_REVIEW_COMPLETED_COLUMNS = [
  "team_lead_review_completed_at",
  "teamlead_review_completed_at",
  "lead_review_completed_at",
] as const;

const TEAM_LEAD_GOAL_RATING_COLUMNS = [
  "team_lead_rating",
  "teamlead_rating",
  "lead_rating",
  "reviewer_rating",
] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ appraisalId: string }> }) {
  try {
    const rawParams = (await params) as { appraisalId?: string; "appraisal-Id"?: string };
    const appraisalId = rawParams.appraisalId ?? rawParams["appraisal-Id"];
    if (!appraisalId) {
      return NextResponse.json({ error: "Invalid appraisal id" }, { status: 400 });
    }
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    const [rows] = await pool.query("SELECT * FROM employee_appraisals WHERE id = ?", [appraisalId]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const appraisal = (rows as any[])[0];

    // Verify that current reviewer actually owns this employee in AARAM mapping.
    const [managerRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );
    const managerKeycloakId = (managerRows as any[])[0]?.keycloak_id as string | undefined;

    const [employeeRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [appraisal.employee_id]
    );
    const employeeKeycloakId = (employeeRows as any[])[0]?.keycloak_id as string | undefined;

    if (!managerKeycloakId || !employeeKeycloakId) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const [reviewerRoleRows] = await pool.query(
      "SELECT role FROM L_db.employee WHERE keycloak_id = ? LIMIT 1",
      [managerKeycloakId]
    );
    const reviewerAaramRole = String((reviewerRoleRows as any[])[0]?.role || "").toLowerCase();
    const isTeamLeadReviewer = reviewerAaramRole === "manager";

    const [hasTeamLeadRows] = await pool.query(
      `SELECT 1
       FROM L_db.employee_reporting_managers erm
       JOIN L_db.employee e ON e.id = erm.employee_id
       JOIN L_db.employee m ON m.id = erm.manager_id
       WHERE e.keycloak_id = ?
         AND LOWER(COALESCE(m.role, '')) = 'manager'
       LIMIT 1`,
      [employeeKeycloakId]
    );
    const hasTeamLead = (hasTeamLeadRows as any[]).length > 0;

    const [teamLeadCompletedColumnRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_appraisals'
         AND COLUMN_NAME IN (${TEAM_LEAD_REVIEW_COMPLETED_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_REVIEW_COMPLETED_COLUMNS]
    );
    const availableTeamLeadCompletedCols = new Set(
      (teamLeadCompletedColumnRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const teamLeadCompletedColumn = TEAM_LEAD_REVIEW_COMPLETED_COLUMNS.find((c) =>
      availableTeamLeadCompletedCols.has(c)
    );

    const appraisalTeamLeadCompletedAt =
      teamLeadCompletedColumn ? appraisal[teamLeadCompletedColumn] : null;

    if (isTeamLeadReviewer) {
      if (!teamLeadCompletedColumn) {
        return NextResponse.json(
          { error: "Team Lead review column is not available in employee_appraisals" },
          { status: 400 }
        );
      }
      if (appraisalTeamLeadCompletedAt) {
        return NextResponse.json({ error: "Team Lead review already completed" }, { status: 400 });
      }
    } else {
      if (appraisal.manager_review_completed_at) {
        return NextResponse.json({ error: "Review already completed" }, { status: 400 });
      }
      if (hasTeamLead && teamLeadCompletedColumn && !appraisalTeamLeadCompletedAt) {
        return NextResponse.json({ error: "Pending Team Lead review" }, { status: 400 });
      }
    }

    let ratingColumn = "performance_rating";
    if (isTeamLeadReviewer) {
      const [teamLeadGoalRatingRows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'employee_goals'
           AND COLUMN_NAME IN (${TEAM_LEAD_GOAL_RATING_COLUMNS.map(() => "?").join(", ")})`,
        [...TEAM_LEAD_GOAL_RATING_COLUMNS]
      );
      const availableGoalRatingCols = new Set(
        (teamLeadGoalRatingRows as any[]).map((r) => String(r.COLUMN_NAME))
      );
      const detectedGoalRatingCol = TEAM_LEAD_GOAL_RATING_COLUMNS.find((c) =>
        availableGoalRatingCols.has(c)
      );
      if (detectedGoalRatingCol) ratingColumn = detectedGoalRatingCol;
    }

    // Check all goals have reviewer-specific rating
    const [goals] = await pool.query(
      `SELECT id, ${ratingColumn} AS reviewer_rating FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0`,
      [appraisalId]
    );
    const unrated = (goals as any[]).filter((g) => g.reviewer_rating === null);
    if (unrated.length > 0) {
      return NextResponse.json(
        { error: `Please rate all goals. ${unrated.length} of ${(goals as any[]).length} not yet rated.` },
        { status: 400 }
      );
    }

    // Calculate weighted average rating
    const [weightedGoals] = await pool.query(
      `SELECT weight, ${ratingColumn} AS final_rating FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0`,
      [appraisalId]
    );
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const g of weightedGoals as any[]) {
      totalWeightedScore += (g.final_rating || 0) * (g.weight || 0);
      totalWeight += g.weight || 0;
    }
    const overallRating = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Determine label
    const LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
    const ratingLabel = LABELS[Math.round(overallRating)] || "Meets Expectations";

    // Get optional body data (hike, promotion)
    let body: any = {};
    try { body = await req.json(); } catch {}

    if (isTeamLeadReviewer) {
      await pool.query(
        `UPDATE employee_appraisals
         SET ${teamLeadCompletedColumn} = NOW(),
             current_phase = 'manager_review'
         WHERE id = ?`,
        [appraisalId]
      );
    } else {
      await pool.query(
        `UPDATE employee_appraisals 
         SET manager_review_completed_at = NOW(),
             current_phase = 'hr_review',
             overall_rating = ?,
             overall_rating_label = ?,
             hike_percentage = ?,
             hike_effective_date = ?,
             promotion_status = ?,
             promotion_notes = ?
         WHERE id = ?`,
        [
          overallRating.toFixed(2),
          ratingLabel,
          body.hike_percentage || null,
          body.hike_effective_date || null,
          body.promotion_status || "not_applicable",
          body.promotion_notes || null,
          appraisalId,
        ]
      );
    }

    // Notify employee
    if (isTeamLeadReviewer) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, 'Team Lead Review Completed', ?, 'info', '/webpage/employee/feedback')`,
        [
          appraisal.employee_id,
          `Your Team Lead ${user.username} has completed the assessment review. Manager review is pending.`,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, 'Manager Review Completed', ?, 'success', '/webpage/employee/feedback')`,
        [appraisal.employee_id, `Your manager ${user.username} has completed the performance review. Check your Feedback & Results page.`]
      );
    }

    return NextResponse.json({ success: true, overallRating: overallRating.toFixed(2), ratingLabel });
  } catch (error: any) {
    console.error("POST /api/manager/complete-review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
