    // app/api/manager/team-goals/route.ts
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
        `SELECT eg.*, ga.area_name
         FROM employee_goals eg
         LEFT JOIN goal_areas ga ON eg.area_id = ga.id
         WHERE eg.appraisal_id = ?
         ORDER BY eg.goal_no`,
        [appraisal.id]
      );

      const totalWeight = (goals as any[]).reduce((s: number, g: any) => s + (g.weight || 0), 0);

      team.push({
        appraisalId: appraisal.id,
        employeeId: appraisal.employee_id,
        employeeName: appraisal.employee_name,
        employeeEmail: appraisal.employee_email,
        currentPhase: appraisal.current_phase,
        goalsSubmittedAt: appraisal.goals_submitted_at,
        goalsApprovedAt: appraisal.goals_approved_at,
        goals: goals,
        totalWeight,
        goalCount: (goals as any[]).length,
      });
    }

    return NextResponse.json({ team });
  } catch (error: any) {
    console.error("GET /api/manager/team-goals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}