// app/api/employee/kpi-designations/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT id, designation_name FROM kpi_designations WHERE is_active = TRUE ORDER BY display_order"
    );
    return NextResponse.json({ designations: rows });
  } catch (error: any) {
    console.error("GET /api/employee/kpi-designations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}