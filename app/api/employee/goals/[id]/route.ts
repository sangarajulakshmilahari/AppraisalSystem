// app/api/employee/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

// PUT — update a goal
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership: goal belongs to this user's appraisal
    const [goalRows] = await pool.query(
      `SELECT eg.*, ea.employee_id, ea.goals_approved_at
       FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND ea.employee_id = ?`,
      [id, user.id]
    );
    const goal = (goalRows as any[])[0];
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    // Can only edit draft goals, not approved ones
    if (goal.status === "approved") {
      return NextResponse.json({ error: "Cannot edit approved goals" }, { status: 403 });
    }
    if (goal.goals_approved_at) {
      return NextResponse.json({ error: "Goals already approved by manager" }, { status: 403 });
    }

    const body = await req.json();
    const { area_id, description, metric, target, timeline, weight } = body;

    await pool.query(
      `UPDATE employee_goals 
       SET area_id = ?, description = ?, metric = ?, target = ?, timeline = ?, weight = ?
       WHERE id = ?`,
      [area_id || null, description, metric || null, target || null, timeline || null, weight || 0, id]
    );

    const [updated] = await pool.query(
      `SELECT eg.*, ga.area_name
       FROM employee_goals eg
       LEFT JOIN goal_areas ga ON eg.area_id = ga.id
       WHERE eg.id = ?`,
      [id]
    );

    return NextResponse.json({ goal: (updated as any[])[0] });
  } catch (error: any) {
    console.error("PUT /api/employee/goals/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a goal
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership and check status
    const [goalRows] = await pool.query(
      `SELECT eg.*, ea.employee_id, ea.goals_approved_at
       FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND ea.employee_id = ?`,
      [id, user.id]
    );
    const goal = (goalRows as any[])[0];
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.status === "approved") {
      return NextResponse.json({ error: "Cannot delete approved goals" }, { status: 403 });
    }

    await pool.query("DELETE FROM employee_goals WHERE id = ?", [id]);

    // Re-sequence goal_no
    const [remaining] = await pool.query(
      "SELECT id FROM employee_goals WHERE appraisal_id = ? ORDER BY goal_no",
      [goal.appraisal_id]
    );
    for (let i = 0; i < (remaining as any[]).length; i++) {
      await pool.query("UPDATE employee_goals SET goal_no = ? WHERE id = ?", [i + 1, (remaining as any[])[i].id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/employee/goals/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}