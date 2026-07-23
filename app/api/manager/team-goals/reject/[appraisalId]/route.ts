// app/api/manager/team-goals/reject/[appraisalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/getuser";

export async function POST(req: NextRequest, { params }: { params: Promise<{ appraisalId: string }> }) {
  try {
    const { appraisalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { reason, goalId } = body;

    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT * FROM employee_appraisals WHERE id = ? AND manager_id = ?",
      [appraisalId, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const appraisal = (rows as any[])[0];

    // If goalId is provided, reject individual goal
    if (goalId) {
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for rejection" }, { status: 400 });
      }

      // Verify goal belongs to this appraisal
      const [goalRows] = await pool.query(
        "SELECT * FROM employee_goals WHERE id = ? AND appraisal_id = ? AND is_deleted = 0",
        [goalId, appraisalId]
      );

      if ((goalRows as any[]).length === 0) {
        return NextResponse.json({ error: "Goal not found" }, { status: 404 });
      }

      const goal = (goalRows as any[])[0];

      // Reject individual goal
      await pool.query(
        "UPDATE employee_goals SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
        [reason, user.id, goalId]
      );

      // Notify employee
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, 'Goal Rejected', ?, 'warning', '/webpage/goals')`,
        [appraisal.employee_id, `Your manager ${user.username} rejected goal #${goal.goal_no}. Reason: ${reason}`]
      );
    } else {
      // Reject all submitted goals (backward compatibility)
      // Set goals back to draft
      await pool.query(
        "UPDATE employee_goals SET status = 'draft' WHERE appraisal_id = ? AND status = 'submitted' AND is_deleted = 0",
        [appraisalId]
      );

      // Reset submission timestamp so employee can resubmit
      await pool.query(
        "UPDATE employee_appraisals SET goals_submitted_at = NULL, current_phase = 'goal_setting' WHERE id = ?",
        [appraisalId]
      );

      // Notify employee
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, 'Goals Returned for Revision', ?, 'warning', '/webpage/goals')`,
        [appraisal.employee_id, `Your manager ${user.username} has returned your goals for revision.${reason ? ' Reason: ' + reason : ''}`]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/manager/team-goals/reject error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
