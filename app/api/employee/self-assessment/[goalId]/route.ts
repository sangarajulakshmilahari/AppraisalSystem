// app/api/employee/self-assessment/[goalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

// PUT — save/update self-assessment text for a specific goal
export async function PUT(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const { goalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership and check submission status
    const [goalRows] = await pool.query(
      `SELECT eg.id, ea.employee_id, ea.self_assessment_submitted_at
       FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND ea.employee_id = ? AND eg.is_deleted = 0`,
      [goalId, user.id]
    );
    const goal = (goalRows as any[])[0];
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.self_assessment_submitted_at) {
      return NextResponse.json({ error: "Self assessment already submitted, cannot edit" }, { status: 403 });
    }

    const body = await req.json();
    const { self_assessment } = body;

    await pool.query(
      "UPDATE employee_goals SET self_assessment = ? WHERE id = ?",
      [self_assessment || null, goalId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/employee/self-assessment/[goalId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
