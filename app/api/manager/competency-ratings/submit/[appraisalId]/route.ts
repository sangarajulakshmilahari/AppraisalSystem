// app/api/manager/competency-ratings/submit/[appraisalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/getuser";

export async function POST(req: NextRequest, { params }: { params: Promise<{ appraisalId: string }> }) {
  try {
    const { appraisalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify manager owns this appraisal
    const [rows] = await pool.query(
      "SELECT * FROM employee_appraisals WHERE id = ? AND manager_id = ?",
      [appraisalId, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const appraisal = (rows as any[])[0];
    if (appraisal.manager_competency_submitted_at) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    // Check all competencies have manager_rating
    const [comps] = await pool.query(
      "SELECT id, manager_rating FROM employee_competencies WHERE appraisal_id = ?",
      [appraisalId]
    );

    if ((comps as any[]).length === 0) {
      return NextResponse.json({ error: "No competencies found" }, { status: 400 });
    }

    const unrated = (comps as any[]).filter((c) => c.manager_rating === null);
    if (unrated.length > 0) {
      return NextResponse.json(
        { error: `Please rate all competencies. ${unrated.length} of ${(comps as any[]).length} not yet rated.` },
        { status: 400 }
      );
    }

    // Mark submitted
    await pool.query(
      "UPDATE employee_appraisals SET manager_competency_submitted_at = NOW() WHERE id = ?",
      [appraisalId]
    );

    // Notify employee
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES (?, 'Competency Ratings Received', ?, 'success', '/webpage/competency')`,
      [
        appraisal.employee_id,
        `Your manager ${user.username} has completed the competency rating review.`,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/manager/competency-ratings/submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}