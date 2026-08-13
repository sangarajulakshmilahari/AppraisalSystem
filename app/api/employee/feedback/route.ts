// app/api/employee/feedback/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

const TEAM_LEAD_GOAL_FEEDBACK_COLUMNS = [
  "team_lead_feedback",
  "teamlead_feedback",
  "lead_feedback",
  "reviewer_feedback",
] as const;

const TEAM_LEAD_GOAL_RATING_COLUMNS = [
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

function formatDate(d: any): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ goals: [], appraisal: null, cycle: null });

    const { cycle, appraisal } = active;
    const pool = getPool();

    const [employeeKeycloakRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );
    const employeeKeycloakId = (employeeKeycloakRows as any[])[0]?.keycloak_id as string | undefined;

    const [teamLeadReviewCompletedRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_appraisals'
         AND COLUMN_NAME IN (${TEAM_LEAD_REVIEW_COMPLETED_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_REVIEW_COMPLETED_COLUMNS]
    );
    const availableTLReviewCompletedCols = new Set(
      (teamLeadReviewCompletedRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const teamLeadReviewCompletedColumn = TEAM_LEAD_REVIEW_COMPLETED_COLUMNS.find((c) =>
      availableTLReviewCompletedCols.has(c)
    );

    const [teamLeadFeedbackColumnRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_goals'
         AND COLUMN_NAME IN (${TEAM_LEAD_GOAL_FEEDBACK_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_GOAL_FEEDBACK_COLUMNS]
    );
    const availableTLFeedbackCols = new Set(
      (teamLeadFeedbackColumnRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const teamLeadFeedbackColumn = TEAM_LEAD_GOAL_FEEDBACK_COLUMNS.find((c) => availableTLFeedbackCols.has(c));

    const [teamLeadRatingColumnRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_goals'
         AND COLUMN_NAME IN (${TEAM_LEAD_GOAL_RATING_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_GOAL_RATING_COLUMNS]
    );
    const availableTLRatingCols = new Set(
      (teamLeadRatingColumnRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const teamLeadRatingColumn = TEAM_LEAD_GOAL_RATING_COLUMNS.find((c) => availableTLRatingCols.has(c));

    const teamLeadFeedbackSelect = teamLeadFeedbackColumn
      ? `eg.${teamLeadFeedbackColumn} AS team_lead_feedback`
      : "NULL AS team_lead_feedback";
    const teamLeadRatingSelect = teamLeadRatingColumn
      ? `eg.${teamLeadRatingColumn} AS team_lead_rating`
      : "NULL AS team_lead_rating";

    // Fetch goals with self-assessment, Team Lead + manager feedback
    const [goals] = await pool.query(
      `SELECT eg.id, eg.goal_no, eg.description, eg.self_assessment,
              eg.manager_feedback,
              eg.performance_rating AS manager_rating,
              eg.performance_rating,
              ${teamLeadFeedbackSelect},
              ${teamLeadRatingSelect},
              ga.area_name
       FROM employee_goals eg
       LEFT JOIN goal_areas ga ON eg.area_id = ga.id
       WHERE eg.appraisal_id = ? AND eg.is_deleted = 0
       ORDER BY eg.goal_no`,
      [appraisal.id]
    );

    // Fetch evidence for each goal
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

    // Resolve whether this employee has a Team Lead in AARAM mapping
    const [hasTeamLeadRows] = await pool.query(
      `SELECT 1
       FROM aaram_db.employee_reporting_managers erm
       JOIN aaram_db.employee e ON e.id = erm.employee_id
       JOIN aaram_db.employee m ON m.id = erm.manager_id
       WHERE e.keycloak_id = ?
         AND LOWER(COALESCE(m.role, '')) = 'manager'
       LIMIT 1`,
      [employeeKeycloakId || ""]
    );
    const hasTeamLead = !!employeeKeycloakId && (hasTeamLeadRows as any[]).length > 0;

    const teamLeadReviewCompletedAt = teamLeadReviewCompletedColumn
      ? appraisal[teamLeadReviewCompletedColumn]
      : null;

    // Calculate average rating from currently available reviewer stage
    const ratedGoals = (goals as any[]).filter((g) => {
      const rating = appraisal.manager_review_completed_at ? g.manager_rating : g.team_lead_rating;
      return rating !== null && rating !== undefined;
    });
    const avgRating = ratedGoals.length > 0
      ? ratedGoals.reduce((sum: number, g: any) => {
          const rating = appraisal.manager_review_completed_at ? g.manager_rating : g.team_lead_rating;
          return sum + Number(rating || 0);
        }, 0) / ratedGoals.length
      : null;

    // Feedback is visible after Team Lead review (if present) or manager review
    const feedbackVisible = hasTeamLead
      ? !!teamLeadReviewCompletedAt || !!appraisal.manager_review_completed_at
      : !!appraisal.manager_review_completed_at;

    // Are results released?
    const resultsReleased = !!appraisal.hr_review_completed_at || appraisal.current_phase === "completed";

    // Get manager name if available
    let managerName = null;
    if (appraisal.manager_id) {
      const [mgr] = await pool.query("SELECT username FROM users WHERE id = ?", [appraisal.manager_id]);
      if ((mgr as any[]).length > 0) managerName = (mgr as any[])[0].username;
    }

    let teamLeadName: string | null = null;
    if (employeeKeycloakId) {
      const [tlRows] = await pool.query(
        `SELECT m.name
         FROM aaram_db.employee_reporting_managers erm
         JOIN aaram_db.employee e ON e.id = erm.employee_id
         JOIN aaram_db.employee m ON m.id = erm.manager_id
         WHERE e.keycloak_id = ?
           AND LOWER(COALESCE(m.role, '')) = 'manager'
         LIMIT 1`,
        [employeeKeycloakId]
      );
      teamLeadName = (tlRows as any[])[0]?.name || null;
    }

    return NextResponse.json({
      goals: goalsWithEvidence,
      cycle: {
        id: cycle.id,
        name: cycle.cycle_name,
        periodStart: formatDate(cycle.period_start),
        periodEnd: formatDate(cycle.period_end),
      },
      appraisal: {
        id: appraisal.id,
        currentPhase: appraisal.current_phase,
        overallRating: appraisal.overall_rating,
        overallRatingLabel: appraisal.overall_rating_label,
        hikePercentage: appraisal.hike_percentage,
        hikeEffectiveDate: formatDate(appraisal.hike_effective_date),
        promotionStatus: appraisal.promotion_status,
        promotionNotes: appraisal.promotion_notes,
        acknowledged: appraisal.acknowledged,
        acknowledgedAt: formatDate(appraisal.acknowledged_at),
        hasTeamLead,
        teamLeadReviewCompletedAt: formatDate(teamLeadReviewCompletedAt),
        managerReviewCompletedAt: formatDate(appraisal.manager_review_completed_at),
      },
      avgRating,
      feedbackVisible,
      resultsReleased,
      managerName,
      teamLeadName,
    });
  } catch (error: any) {
    console.error("GET /api/employee/feedback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
