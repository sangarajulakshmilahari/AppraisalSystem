// app/api/manager/complete-review/[appraisalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

export async function POST(req: NextRequest, { params }: { params: Promise<{ appraisalId: string }> }) {
  try {
    const { appraisalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT * FROM employee_appraisals WHERE id = ? AND manager_id = ?",
      [appraisalId, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const appraisal = (rows as any[])[0];
    if (appraisal.manager_review_completed_at) {
      return NextResponse.json({ error: "Review already completed" }, { status: 400 });
    }

    // Check all goals have performance_rating
    const [goals] = await pool.query(
      "SELECT id, performance_rating FROM employee_goals WHERE appraisal_id = ?",
      [appraisalId]
    );
    const unrated = (goals as any[]).filter((g) => g.performance_rating === null);
    if (unrated.length > 0) {
      return NextResponse.json(
        { error: `Please rate all goals. ${unrated.length} of ${(goals as any[]).length} not yet rated.` },
        { status: 400 }
      );
    }

    // Calculate weighted average rating
    const [weightedGoals] = await pool.query(
      "SELECT weight, performance_rating FROM employee_goals WHERE appraisal_id = ?",
      [appraisalId]
    );
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const g of weightedGoals as any[]) {
      totalWeightedScore += (g.performance_rating || 0) * (g.weight || 0);
      totalWeight += g.weight || 0;
    }
    const overallRating = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Determine label
    const LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
    const ratingLabel = LABELS[Math.round(overallRating)] || "Meets Expectations";

    // Get optional body data (hike, promotion)
    let body: any = {};
    try { body = await req.json(); } catch {}

    // Update appraisal
    await pool.query(
      `UPDATE employee_appraisals 
       SET manager_review_completed_at = NOW(),
           current_phase = 'hr_review',
           overall_rating = ?,
           overall_rating_label = ?,
           hike_percentage = ?,
           hike_effective_date = ?,
           promotion_status = ?,
           promotion_notes = ?
       WHERE id = ?`,
      [
        overallRating.toFixed(2),
        ratingLabel,
        body.hike_percentage || null,
        body.hike_effective_date || null,
        body.promotion_status || "not_applicable",
        body.promotion_notes || null,
        appraisalId,
      ]
    );

    // Notify employee
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES (?, 'Manager Review Completed', ?, 'success', '/webpage/feedback')`,
      [appraisal.employee_id, `Your manager ${user.username} has completed the performance review. Check your Feedback & Results page.`]
    );

    return NextResponse.json({ success: true, overallRating: overallRating.toFixed(2), ratingLabel });
  } catch (error: any) {
    console.error("POST /api/manager/complete-review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}