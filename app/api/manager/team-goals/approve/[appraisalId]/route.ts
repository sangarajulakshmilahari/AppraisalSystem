// app/api/manager/team-goals/approve/[appraisalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/getuser";

export async function POST(req: NextRequest, { params }: { params: Promise<{ appraisalId: string }> }) {
  try {
    const { appraisalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify this manager owns this appraisal
    const [rows] = await pool.query(
      "SELECT * FROM employee_appraisals WHERE id = ? AND manager_id = ?",
      [appraisalId, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found or not your team member" }, { status: 404 });
    }

    const appraisal = (rows as any[])[0];
    if (appraisal.goals_approved_at) {
      return NextResponse.json({ error: "Goals already approved" }, { status: 400 });
    }

    // Approve all submitted goals
    await pool.query(
      "UPDATE employee_goals SET status = 'approved' WHERE appraisal_id = ? AND status = 'submitted'",
      [appraisalId]
    );

    // Update appraisal
    await pool.query(
      `UPDATE employee_appraisals 
       SET goals_approved_at = NOW(), current_phase = 'self_assessment'
       WHERE id = ?`,
      [appraisalId]
    );

    // Notify employee
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES (?, 'Goals Approved', ?, 'success', '/webpage/goals')`,
      [appraisal.employee_id, `Your manager ${user.username} has approved all your goals. You can now proceed to self-assessment.`]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/manager/team-goals/approve error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}