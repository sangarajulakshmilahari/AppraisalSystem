// app/api/manager/team-assessments/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser } from "../../lib/getuser";
import { getTeamAppraisals } from "../../lib/getteam";

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

const TEAM_LEAD_REVIEW_COMPLETED_COLUMNS = [
  "team_lead_review_completed_at",
  "teamlead_review_completed_at",
  "lead_review_completed_at",
] as const;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const teamAppraisals = await getTeamAppraisals(user.id);
    const pool = getPool();

    // Detect reviewer role from AARAM (Team Lead role is stored as 'Manager').
    const [reviewerRows] = await pool.query(
      "SELECT u.keycloak_id, ae.role FROM users u LEFT JOIN L_db.employee ae ON ae.keycloak_id = u.keycloak_id WHERE u.id = ? LIMIT 1",
      [user.id]
    );
    const reviewerAaramRole = String((reviewerRows as any[])[0]?.role || "").toLowerCase();
    const isTeamLeadReviewer = reviewerAaramRole === "manager";

    // Find available team-lead feedback column in employee_goals (if any).
    const [teamLeadColumnRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_goals'
         AND COLUMN_NAME IN (${TEAM_LEAD_FEEDBACK_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_FEEDBACK_COLUMNS]
    );
    const availableTeamLeadCols = new Set((teamLeadColumnRows as any[]).map((r) => String(r.COLUMN_NAME)));
    const detectedTeamLeadColumn = TEAM_LEAD_FEEDBACK_COLUMNS.find((c) => availableTeamLeadCols.has(c));
    const [teamLeadRatingRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_goals'
         AND COLUMN_NAME IN (${TEAM_LEAD_RATING_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_RATING_COLUMNS]
    );
    const availableTeamLeadRatingCols = new Set((teamLeadRatingRows as any[]).map((r) => String(r.COLUMN_NAME)));
    const detectedTeamLeadRatingColumn = TEAM_LEAD_RATING_COLUMNS.find((c) => availableTeamLeadRatingCols.has(c));

    const [teamLeadReviewCompletedRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_appraisals'
         AND COLUMN_NAME IN (${TEAM_LEAD_REVIEW_COMPLETED_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_REVIEW_COMPLETED_COLUMNS]
    );
    const availableTeamLeadReviewCompletedCols = new Set(
      (teamLeadReviewCompletedRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const detectedTeamLeadReviewCompletedColumn = TEAM_LEAD_REVIEW_COMPLETED_COLUMNS.find((c) =>
      availableTeamLeadReviewCompletedCols.has(c)
    );

    const feedbackSelect = isTeamLeadReviewer && detectedTeamLeadColumn
      ? `eg.${detectedTeamLeadColumn} AS manager_feedback`
      : "eg.manager_feedback";
    const ratingSelect = isTeamLeadReviewer && detectedTeamLeadRatingColumn
      ? `eg.${detectedTeamLeadRatingColumn}`
      : "eg.performance_rating";

    const team = [];
    for (const appraisal of teamAppraisals) {
      const [goals] = await pool.query(
        `SELECT eg.id, eg.goal_no, eg.description, eg.self_assessment,
                ${feedbackSelect}, ${ratingSelect} AS performance_rating,
                ga.area_name
         FROM employee_goals eg
         LEFT JOIN goal_areas ga ON eg.area_id = ga.id
         WHERE eg.appraisal_id = ? AND eg.is_deleted = 0
         ORDER BY eg.goal_no`,
        [appraisal.id]
      );

      // Get evidence for each goal
      const goalIds = (goals as any[]).map((g) => g.id);
      let evidenceMap: Record<number, any[]> = {};
      if (goalIds.length > 0) {
        const [evidence] = await pool.query(
          "SELECT * FROM goal_evidence WHERE goal_id IN (?) ORDER BY id",
          [goalIds]
        );
        for (const ev of evidence as any[]) {
          if (!evidenceMap[ev.goal_id]) evidenceMap[ev.goal_id] = [];
          evidenceMap[ev.goal_id].push(ev);
        }
      }

      const goalsWithEvidence = (goals as any[]).map((g) => ({
        ...g,
        evidence: evidenceMap[g.id] || [],
      }));

      team.push({
        appraisalId: appraisal.id,
        employeeId: appraisal.employee_id,
        employeeName: appraisal.employee_name,
        employeeEmail: appraisal.employee_email,
        currentPhase: appraisal.current_phase,
        selfAssessmentSubmittedAt: appraisal.self_assessment_submitted_at,
        managerReviewCompletedAt: appraisal.manager_review_completed_at,
        teamLeadReviewCompletedAt: detectedTeamLeadReviewCompletedColumn
          ? appraisal[detectedTeamLeadReviewCompletedColumn]
          : null,
        goals: goalsWithEvidence,
      });
    }

    return NextResponse.json({
      team,
      reviewerMode: isTeamLeadReviewer ? "team_lead" : "manager",
    });
  } catch (error: any) {
    console.error("GET /api/manager/team-assessments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
