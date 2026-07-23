// app/api/manager/team-assessments/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser } from "../../lib/getuser";
import { getTeamAppraisals } from "../../lib/getteam";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const teamAppraisals = await getTeamAppraisals(user.id);
    const pool = getPool();

    const team = [];
    for (const appraisal of teamAppraisals) {
      const [goals] = await pool.query(
        `SELECT eg.id, eg.goal_no, eg.description, eg.self_assessment,
                eg.manager_feedback, eg.performance_rating,
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
        goals: goalsWithEvidence,
      });
    }

    return NextResponse.json({ team });
  } catch (error: any) {
    console.error("GET /api/manager/team-assessments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
