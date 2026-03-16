
// app/api/employee/self-assessment/submit/route.ts
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

    if (appraisal.self_assessment_submitted_at) {
      return NextResponse.json({ error: "Self assessment already submitted" }, { status: 400 });
    }

    const pool = getPool();

    // Check all goals have self_assessment filled
    const [goals] = await pool.query(
      "SELECT id, self_assessment FROM employee_goals WHERE appraisal_id = ?",
      [appraisal.id]
    );

    if ((goals as any[]).length === 0) {
      return NextResponse.json({ error: "No goals found" }, { status: 400 });
    }

    const unfilled = (goals as any[]).filter(
      (g) => !g.self_assessment || g.self_assessment.trim() === ""
    );

    if (unfilled.length > 0) {
      return NextResponse.json(
        { error: `Please fill self-assessment for all ${(goals as any[]).length} goals. ${unfilled.length} remaining.` },
        { status: 400 }
      );
    }

    // Update appraisal: mark submitted, advance phase
    await pool.query(
      `UPDATE employee_appraisals 
       SET self_assessment_submitted_at = NOW(),
           current_phase = 'competency_assessment'
       WHERE id = ?`,
      [appraisal.id]
    );

    // TODO: Send email notification to reporting manager
    // For now, create a notification if manager_id is set
    if (appraisal.manager_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, ?, ?, 'action', '/webpage/manager/team-assessments')`,
        [
          appraisal.manager_id,
          "Self Assessment Submitted",
          `${user.username} has completed their self-assessment and is ready for your review.`,
        ]
      );
    }

    return NextResponse.json({ success: true, message: "Self assessment submitted successfully" });
  } catch (error: any) {
    console.error("POST /api/employee/self-assessment/submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}