// app/api/manager/competency-rate/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify manager
    const [rows] = await pool.query(
      `SELECT ec.id FROM employee_competencies ec
       JOIN employee_appraisals ea ON ec.appraisal_id = ea.id
       WHERE ec.id = ? AND ea.manager_id = ?`,
      [id, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { manager_rating, manager_feedback } = body;

    if (manager_rating !== null && manager_rating !== undefined && (manager_rating < 1 || manager_rating > 5)) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    await pool.query(
      "UPDATE employee_competencies SET manager_rating = ?, manager_feedback = ? WHERE id = ?",
      [manager_rating || null, manager_feedback || null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/manager/competencyrate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}