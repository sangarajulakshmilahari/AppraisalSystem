// app/api/employee/goal-areas/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, area_name FROM goal_areas 
       WHERE is_active = TRUE 
       ORDER BY display_order`
    );
    return NextResponse.json({ areas: rows });
  } catch (error: any) {
    console.error("GET /api/employee/goal-areas error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}