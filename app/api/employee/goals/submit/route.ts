// app/api/employee/goals/submit/route.ts
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

    if (appraisal.goals_submitted_at) {
      return NextResponse.json({ error: "Goals already submitted" }, { status: 400 });
    }

    const pool = getPool();

    // Check there's at least one goal
    const [goals] = await pool.query(
      "SELECT id, weight FROM employee_goals WHERE appraisal_id = ?",
      [appraisal.id]
    );
    if ((goals as any[]).length === 0) {
      return NextResponse.json({ error: "Add at least one goal before submitting" }, { status: 400 });
    }

    // Check total weight = 100
    const totalWeight = (goals as any[]).reduce((sum: number, g: any) => sum + (g.weight || 0), 0);
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: `Total weight must be 100%. Current total: ${totalWeight}%` },
        { status: 400 }
      );
    }

    // Update all draft goals to submitted
    await pool.query(
      `UPDATE employee_goals SET status = 'submitted' WHERE appraisal_id = ? AND status = 'draft'`,
      [appraisal.id]
    );

    // Update appraisal timestamp
    await pool.query(
      `UPDATE employee_appraisals SET goals_submitted_at = NOW() WHERE id = ?`,
      [appraisal.id]
    );

    return NextResponse.json({ success: true, message: "Goals submitted for manager approval" });
  } catch (error: any) {
    console.error("POST /api/employee/goals/submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}