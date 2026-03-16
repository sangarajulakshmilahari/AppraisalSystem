// app/api/employee/development-plan/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

// PUT — update a development plan entry
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership
    const [rows] = await pool.query(
      "SELECT * FROM employee_development_plans WHERE id = ? AND employee_id = ?",
      [id, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, timeline, responsible, status } = body;

    await pool.query(
      `UPDATE employee_development_plans 
       SET action = COALESCE(?, action),
           timeline = COALESCE(?, timeline),
           responsible = COALESCE(?, responsible),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [action || null, timeline || null, responsible || null, status || null, id]
    );

    const [updated] = await pool.query(
      `SELECT edp.*, da.area_name
       FROM employee_development_plans edp
       JOIN development_areas da ON edp.area_id = da.id
       WHERE edp.id = ?`,
      [id]
    );

    return NextResponse.json({ entry: (updated as any[])[0] });
  } catch (error: any) {
    console.error("PUT /api/employee/development-plan/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a development plan entry
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    const [rows] = await pool.query(
      "SELECT * FROM employee_development_plans WHERE id = ? AND employee_id = ?",
      [id, user.id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM employee_development_plans WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/employee/development-plan/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}