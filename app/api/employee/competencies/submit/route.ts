// app/api/employee/competencies/submit/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../../lib/getuser";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ error: "No active appraisal cycle" }, { status: 400 });

    const { appraisal } = active;

    if (appraisal.competency_submitted_at) {
      return NextResponse.json({ error: "Competency assessment already submitted" }, { status: 400 });
    }

    const pool = getPool();

    // Check all competencies have a self_rating
    const [comps] = await pool.query(
      "SELECT id, self_rating FROM employee_competencies WHERE appraisal_id = ?",
      [appraisal.id]
    );

    if ((comps as any[]).length === 0) {
      return NextResponse.json({ error: "No competencies found" }, { status: 400 });
    }

    const unrated = (comps as any[]).filter((c) => c.self_rating === null);
    if (unrated.length > 0) {
      return NextResponse.json(
        { error: `Please rate all competencies. ${unrated.length} of ${(comps as any[]).length} not yet rated.` },
        { status: 400 }
      );
    }

    // Mark submitted, advance phase
    await pool.query(
      `UPDATE employee_appraisals 
       SET competency_submitted_at = NOW(),
           current_phase = 'manager_review'
       WHERE id = ?`,
      [appraisal.id]
    );

    // Notify manager
    if (appraisal.manager_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, ?, ?, 'action', '/webpage/manager/competency-ratings')`,
        [
          appraisal.manager_id,
          "Competency Assessment Submitted",
          `${user.username} has completed their competency self-assessment and is ready for your review.`,
        ]
      );
    }

    return NextResponse.json({ success: true, message: "Competency assessment submitted" });
  } catch (error: any) {
    console.error("POST /api/employee/competencies/submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}