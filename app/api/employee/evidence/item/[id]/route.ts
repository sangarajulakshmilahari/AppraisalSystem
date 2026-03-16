// app/api/employee/evidence/item/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/getuser";

// PUT — update an evidence row
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership through goal → appraisal → user chain
    const [rows] = await pool.query(
      `SELECT ge.id, ea.self_assessment_submitted_at
       FROM goal_evidence ge
       JOIN employee_goals eg ON ge.goal_id = eg.id
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE ge.id = ? AND ea.employee_id = ?`,
      [id, user.id]
    );
    const ev = (rows as any[])[0];
    if (!ev) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });

    if (ev.self_assessment_submitted_at) {
      return NextResponse.json({ error: "Self assessment already submitted" }, { status: 403 });
    }

    const body = await req.json();
    const { month, description } = body;

    await pool.query(
      "UPDATE goal_evidence SET month = ?, description = ? WHERE id = ?",
      [month, description, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/employee/evidence/item/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove an evidence row
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership
    const [rows] = await pool.query(
      `SELECT ge.id, ea.self_assessment_submitted_at
       FROM goal_evidence ge
       JOIN employee_goals eg ON ge.goal_id = eg.id
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE ge.id = ? AND ea.employee_id = ?`,
      [id, user.id]
    );
    const ev = (rows as any[])[0];
    if (!ev) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });

    if (ev.self_assessment_submitted_at) {
      return NextResponse.json({ error: "Self assessment already submitted" }, { status: 403 });
    }

    await pool.query("DELETE FROM goal_evidence WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/employee/evidence/item/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}