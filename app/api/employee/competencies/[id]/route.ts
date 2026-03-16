// app/api/employee/competencies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership
    const [rows] = await pool.query(
      `SELECT ec.id, ea.employee_id, ea.competency_submitted_at
       FROM employee_competencies ec
       JOIN employee_appraisals ea ON ec.appraisal_id = ea.id
       WHERE ec.id = ? AND ea.employee_id = ?`,
      [id, user.id]
    );
    const comp = (rows as any[])[0];
    if (!comp) return NextResponse.json({ error: "Competency not found" }, { status: 404 });

    if (comp.competency_submitted_at) {
      return NextResponse.json({ error: "Competency assessment already submitted" }, { status: 403 });
    }

    const body = await req.json();
    const { self_rating } = body;

    if (self_rating !== null && (self_rating < 1 || self_rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    await pool.query(
      "UPDATE employee_competencies SET self_rating = ? WHERE id = ?",
      [self_rating, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/employee/competencies/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}