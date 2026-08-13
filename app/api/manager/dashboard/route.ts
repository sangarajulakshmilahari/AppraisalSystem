// app/api/manager/dashboard/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser } from "../../lib/getuser";
import { getTeamAppraisals } from "../../lib/getteam";

function formatDate(d: any): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const teamAppraisals = await getTeamAppraisals(user.id);

    if (teamAppraisals.length === 0) {
      return NextResponse.json({
        hasTeam: false,
        message: "No team members assigned for the active cycle.",
      });
    }

    const pool = getPool();

    const [reviewerRows] = await pool.query(
      "SELECT u.keycloak_id, ae.role FROM users u LEFT JOIN L_db.employee ae ON ae.keycloak_id = u.keycloak_id WHERE u.id = ? LIMIT 1",
      [user.id]
    );
    const reviewerAaramRole = String((reviewerRows as any[])[0]?.role || "").toLowerCase();
    const isTeamLeadReviewer = reviewerAaramRole === "manager";

    const teamLeadReviewCompletedCandidates = [
      "team_lead_review_completed_at",
      "teamlead_review_completed_at",
      "lead_review_completed_at",
    ];
    const [tlReviewCols] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_appraisals'
         AND COLUMN_NAME IN (${teamLeadReviewCompletedCandidates.map(() => "?").join(", ")})`,
      [...teamLeadReviewCompletedCandidates]
    );
    const tlReviewColSet = new Set((tlReviewCols as any[]).map((r) => String(r.COLUMN_NAME)));
    const teamLeadReviewCompletedColumn = teamLeadReviewCompletedCandidates.find((c) => tlReviewColSet.has(c));
    const cycleName = teamAppraisals[0]?.cycle_name || "";
    const periodStart = formatDate(teamAppraisals[0]?.period_start);
    const periodEnd = formatDate(teamAppraisals[0]?.period_end);

    // ── Team member details ──
    const members = [];
    let goalsAwaitingApproval = 0;
    let assessmentsToReview = 0;
    let reviewsCompleted = 0;

    for (const a of teamAppraisals) {
      // Count goals
      const [goals] = await pool.query(
        "SELECT COUNT(*) as cnt FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0",
        [a.id]
      );
      const goalCount = (goals as any[])[0].cnt;

      // Check statuses
      if (a.goals_submitted_at && !a.goals_approved_at) goalsAwaitingApproval++;
      const reviewerCompleted = isTeamLeadReviewer
        ? !!(teamLeadReviewCompletedColumn ? a[teamLeadReviewCompletedColumn] : null)
        : !!a.manager_review_completed_at;

      if (a.self_assessment_submitted_at && !reviewerCompleted) assessmentsToReview++;
      if (reviewerCompleted) reviewsCompleted++;

      // Phase label
      const PHASE_LABELS: Record<string, string> = {
        goal_setting: "Goal Setting",
        self_assessment: "Self Assessment",
        competency_assessment: "Competency",
        team_lead_review: "Team Lead Review",
        manager_review: "Manager Review",
        hr_review: "HR Review",
        completed: "Completed",
      };

      // Phase color
      const PHASE_COLORS: Record<string, string> = {
        goal_setting: "#6b7280",
        self_assessment: "#f59e0b",
        competency_assessment: "#0891b2",
        team_lead_review: "#6d28d9",
        manager_review: "#7c3aed",
        hr_review: "#1d4ed8",
        completed: "#10b981",
      };

      members.push({
        appraisalId: a.id,
        employeeId: a.employee_id,
        employeeName: a.employee_name,
        employeeEmail: a.employee_email,
        currentPhase: a.current_phase,
        phaseLabel: PHASE_LABELS[a.current_phase] || a.current_phase,
        phaseColor: PHASE_COLORS[a.current_phase] || "#6b7280",
        goalCount,
        goalsSubmitted: !!a.goals_submitted_at,
        goalsApproved: !!a.goals_approved_at,
        saSubmitted: !!a.self_assessment_submitted_at,
        competencySubmitted: !!a.competency_submitted_at,
        reviewCompleted: reviewerCompleted,
        overallRating: a.overall_rating,
        overallRatingLabel: a.overall_rating_label,
      });
    }

    // ── Pending actions ──
    const pendingActions: { id: number; title: string; desc: string; urgent: boolean; href: string }[] = [];
    let actionId = 1;

    for (const m of members) {
      if (m.goalsSubmitted && !m.goalsApproved) {
        pendingActions.push({
          id: actionId++,
          title: `Approve goals for ${m.employeeName}`,
          desc: `${m.goalCount} goals submitted`,
          urgent: true,
          href: "/webpage/manager/team-goals",
        });
      }
      if (m.saSubmitted && !m.reviewCompleted) {
        pendingActions.push({
          id: actionId++,
          title: `Review assessment for ${m.employeeName}`,
          desc: "Self assessment submitted — awaiting your review",
          urgent: true,
          href: "/webpage/manager/team-assessments",
        });
      }
      if (m.competencySubmitted && !m.reviewCompleted) {
        pendingActions.push({
          id: actionId++,
          title: `Rate competencies for ${m.employeeName}`,
          desc: "Competency self-ratings submitted",
          urgent: false,
          href: "/webpage/manager/competency-ratings",
        });
      }
    }

    return NextResponse.json({
      hasTeam: true,
      cycle: { name: cycleName, periodStart, periodEnd },
      teamSize: members.length,
      stats: [
        { label: "Team Members", value: String(members.length), color: "#7c3aed" },
        { label: "Goals to Approve", value: String(goalsAwaitingApproval), color: goalsAwaitingApproval > 0 ? "#f59e0b" : "#10b981" },
        { label: "Assessments to Review", value: String(assessmentsToReview), color: assessmentsToReview > 0 ? "#f59e0b" : "#10b981" },
        { label: "Reviews Completed", value: `${reviewsCompleted} / ${members.length}`, color: reviewsCompleted === members.length ? "#10b981" : "#7c3aed" },
      ],
      members,
      pendingActions,
    });
  } catch (error: any) {
    console.error("GET /api/manager/dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
