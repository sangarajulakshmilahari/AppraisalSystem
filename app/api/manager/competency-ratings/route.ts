// app/api/manager/competency-ratings/route.ts
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
      const [comps] = await pool.query(
        `SELECT ec.id, ec.competency_id, ec.self_rating, ec.manager_rating, ec.manager_feedback,
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
        managerCompetencySubmittedAt: appraisal.manager_competency_submitted_at,
        competencies: comps,
      });
    }

    return NextResponse.json({ team });
  } catch (error: any) {
    console.error("GET /api/manager/competency-ratings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}