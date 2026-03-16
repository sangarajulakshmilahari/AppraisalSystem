// app/api/employee/self-assessment/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ goals: [], cycle: null, appraisal: null });

    const { cycle, appraisal } = active;
    const pool = getPool();

    // Fetch goals with area name
    const [goals] = await pool.query(
      `SELECT eg.id, eg.goal_no, eg.description, eg.self_assessment,
              eg.manager_feedback, eg.performance_rating,
              ga.area_name
       FROM employee_goals eg
       LEFT JOIN goal_areas ga ON eg.area_id = ga.id
       WHERE eg.appraisal_id = ?
       ORDER BY eg.goal_no`,
      [appraisal.id]
    );

    // Fetch all evidence rows for these goals
    const goalIds = (goals as any[]).map((g) => g.id);
    let evidenceMap: Record<number, any[]> = {};

    if (goalIds.length > 0) {
      const [evidence] = await pool.query(
        `SELECT * FROM goal_evidence WHERE goal_id IN (?) ORDER BY id`,
        [goalIds]
      );
      for (const ev of evidence as any[]) {
        if (!evidenceMap[ev.goal_id]) evidenceMap[ev.goal_id] = [];
        evidenceMap[ev.goal_id].push(ev);
      }
    }

    // Attach evidence to each goal
    const goalsWithEvidence = (goals as any[]).map((g) => ({
      ...g,
      evidence: evidenceMap[g.id] || [],
    }));

    // Determine if self-assessment window is open
    // Convert MySQL DATE fields to comparable date strings (YYYY-MM-DD)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saStart = cycle.self_assessment_start ? new Date(cycle.self_assessment_start) : null;
    const saEnd = cycle.self_assessment_end ? new Date(cycle.self_assessment_end) : null;
    if (saStart) saStart.setHours(0, 0, 0, 0);
    if (saEnd) saEnd.setHours(23, 59, 59, 999);

    const saWindowOpen = !!(saStart && saEnd && today >= saStart && today <= saEnd);
    const saEditable = saWindowOpen && !appraisal.self_assessment_submitted_at;

    // Format dates for display
    const formatDate = (d: any) => {
      if (!d) return null;
      const dt = new Date(d);
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    return NextResponse.json({
      goals: goalsWithEvidence,
      cycle: {
        id: cycle.id,
        name: cycle.cycle_name,
        saWindowOpen,
        selfAssessmentStart: formatDate(cycle.self_assessment_start),
        selfAssessmentEnd: formatDate(cycle.self_assessment_end),
      },
      appraisal: {
        id: appraisal.id,
        currentPhase: appraisal.current_phase,
        selfAssessmentSubmittedAt: appraisal.self_assessment_submitted_at,
      },
      saEditable,
    });
  } catch (error: any) {
    console.error("GET /api/employee/self-assessment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}