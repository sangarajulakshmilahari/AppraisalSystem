// app/api/manager/competency-ratings/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser } from "../../lib/getuser";
import { getTeamAppraisals } from "../../lib/getteam";

const TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS = [
  "team_lead_feedback",
  "teamlead_feedback",
  "lead_feedback",
  "reviewer_feedback",
] as const;

const TEAM_LEAD_COMP_SUBMITTED_COLUMNS = [
  "team_lead_competency_submitted_at",
  "teamlead_competency_submitted_at",
  "lead_competency_submitted_at",
] as const;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const teamAppraisals = await getTeamAppraisals(user.id);
    const pool = getPool();

    const [reviewerRows] = await pool.query(
      "SELECT u.keycloak_id, ae.role FROM users u LEFT JOIN L_db.employee ae ON ae.keycloak_id = u.keycloak_id WHERE u.id = ? LIMIT 1",
      [user.id]
    );
    const reviewerAaramRole = String((reviewerRows as any[])[0]?.role || "").toLowerCase();
    const isTeamLeadReviewer = reviewerAaramRole === "manager";

    const [teamLeadFeedbackColumnRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_competencies'
         AND COLUMN_NAME IN (${TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS]
    );
    const availableTeamLeadFeedbackCols = new Set(
      (teamLeadFeedbackColumnRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const detectedTeamLeadFeedbackColumn = TEAM_LEAD_COMPETENCY_FEEDBACK_COLUMNS.find((c) =>
      availableTeamLeadFeedbackCols.has(c)
    );

    const [teamLeadCompSubmittedColRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_appraisals'
         AND COLUMN_NAME IN (${TEAM_LEAD_COMP_SUBMITTED_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_COMP_SUBMITTED_COLUMNS]
    );
    const availableTeamLeadCompSubmittedCols = new Set(
      (teamLeadCompSubmittedColRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const detectedTeamLeadCompSubmittedCol = TEAM_LEAD_COMP_SUBMITTED_COLUMNS.find((c) =>
      availableTeamLeadCompSubmittedCols.has(c)
    );

    const competencyRatingSelect = isTeamLeadReviewer ? "ec.team_lead_rating AS manager_rating" : "ec.manager_rating";
    const competencyFeedbackSelect = isTeamLeadReviewer && detectedTeamLeadFeedbackColumn
      ? `ec.${detectedTeamLeadFeedbackColumn} AS manager_feedback`
      : "ec.manager_feedback";

    const team = [];
    for (const appraisal of teamAppraisals) {
      const [comps] = await pool.query(
        `SELECT ec.id, ec.competency_id, ec.self_rating, ${competencyRatingSelect}, ${competencyFeedbackSelect},
                ca.area_name, ca.expected_behaviour
         FROM employee_competencies ec
         JOIN competency_areas ca ON ec.competency_id = ca.id
         WHERE ec.appraisal_id = ?
         ORDER BY ca.display_order`,
        [appraisal.id]
      );

      team.push({
        appraisalId: appraisal.id,
        employeeName: appraisal.employee_name,
        employeeEmail: appraisal.employee_email,
        currentPhase: appraisal.current_phase,
        competencySubmittedAt: appraisal.competency_submitted_at,
        managerCompetencySubmittedAt: isTeamLeadReviewer
          ? (detectedTeamLeadCompSubmittedCol ? appraisal[detectedTeamLeadCompSubmittedCol] : null)
          : appraisal.manager_competency_submitted_at,
        competencies: comps,
      });
    }

    return NextResponse.json({
      team,
      reviewerMode: isTeamLeadReviewer ? "team_lead" : "manager",
    });
  } catch (error: any) {
    console.error("GET /api/manager/competency-ratings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
