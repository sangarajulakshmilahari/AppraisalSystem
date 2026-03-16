// app/api/employee/feedback/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

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

    // Fetch goals with self-assessment, evidence, and manager feedback
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

    // Calculate average rating from goals that have performance_rating
    const ratedGoals = (goals as any[]).filter((g) => g.performance_rating !== null);
    const avgRating = ratedGoals.length > 0
      ? ratedGoals.reduce((sum: number, g: any) => sum + g.performance_rating, 0) / ratedGoals.length
      : null;

    // Is feedback visible? Only after manager review is completed
    const feedbackVisible = !!appraisal.manager_review_completed_at;

    // Are results released?
    const resultsReleased = !!appraisal.hr_review_completed_at || appraisal.current_phase === "completed";

    // Get manager name if available
    let managerName = null;
    if (appraisal.manager_id) {
      const [mgr] = await pool.query("SELECT username FROM users WHERE id = ?", [appraisal.manager_id]);
      if ((mgr as any[]).length > 0) managerName = (mgr as any[])[0].username;
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
        managerReviewCompletedAt: formatDate(appraisal.manager_review_completed_at),
      },
      avgRating,
      feedbackVisible,
      resultsReleased,
      managerName,
    });
  } catch (error: any) {
    console.error("GET /api/employee/feedback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}