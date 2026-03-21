// app/api/manager/development-plans/route.ts
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
      const [entries] = await pool.query(
        `SELECT edp.*, da.area_name
         FROM employee_development_plans edp
         JOIN development_areas da ON edp.area_id = da.id
         WHERE edp.employee_id = ?
         ORDER BY da.display_order, edp.created_at`,
        [appraisal.employee_id]
      );

      const total = (entries as any[]).length;
      const completed = (entries as any[]).filter((e) => e.status === "completed").length;
      const inProgress = (entries as any[]).filter((e) => e.status === "in_progress").length;

      team.push({
        appraisalId: appraisal.id,
        employeeId: appraisal.employee_id,
        employeeName: appraisal.employee_name,
        employeeEmail: appraisal.employee_email,
        entries,
        total,
        completed,
        inProgress,
        notStarted: total - completed - inProgress,
      });
    }

    return NextResponse.json({ team });
  } catch (error: any) {
    console.error("GET /api/manager/development-plans error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}