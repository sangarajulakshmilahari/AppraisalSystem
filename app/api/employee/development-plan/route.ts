// app/api/employee/development-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

// GET — fetch all development plan entries for the logged-in employee
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    const cycleId = active?.cycle?.id || null;

    const pool = getPool();

    const [entries] = await pool.query(
      `SELECT edp.*, da.area_name
       FROM employee_development_plans edp
       JOIN development_areas da ON edp.area_id = da.id
       WHERE edp.employee_id = ?
       ORDER BY da.display_order, edp.created_at`,
      [user.id]
    );

    return NextResponse.json({
      entries,
      cycleId,
      cycleName: active?.cycle?.cycle_name || null,
    });
  } catch (error: any) {
    console.error("GET /api/employee/development-plan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — add a new development plan entry
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    const cycleId = active?.cycle?.id || null;

    const body = await req.json();
    const { area_id, action, timeline, responsible } = body;

    if (!area_id) return NextResponse.json({ error: "Development area is required" }, { status: 400 });
    if (!action?.trim()) return NextResponse.json({ error: "Action is required" }, { status: 400 });

    const pool = getPool();

    const [result] = await pool.query(
      `INSERT INTO employee_development_plans (employee_id, cycle_id, area_id, action, timeline, responsible)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, cycleId, area_id, action, timeline || null, responsible || "Self"]
    );

    const [newEntry] = await pool.query(
      `SELECT edp.*, da.area_name
       FROM employee_development_plans edp
       JOIN development_areas da ON edp.area_id = da.id
       WHERE edp.id = ?`,
      [(result as any).insertId]
    );

    return NextResponse.json({ entry: (newEntry as any[])[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employee/development-plan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}