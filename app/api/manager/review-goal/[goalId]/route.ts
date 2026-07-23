// app/api/manager/review-goal/[goalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const { goalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify manager owns this goal's appraisal
    const [rows] = await pool.query(
      `SELECT eg.id, ea.manager_id
       FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND ea.manager_id = ? AND eg.is_deleted = 0`,
      [goalId, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found or not your team member" }, { status: 404 });
    }

    const body = await req.json();
    const { manager_feedback, performance_rating } = body;

    if (performance_rating !== null && performance_rating !== undefined && (performance_rating < 1 || performance_rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    await pool.query(
      "UPDATE employee_goals SET manager_feedback = ?, performance_rating = ? WHERE id = ?",
      [manager_feedback || null, performance_rating || null, goalId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/manager/review-goal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
