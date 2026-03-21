// app/api/employee/kpi-templates/[designationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ designationId: string }> }) {
  try {
    const { designationId } = await params;
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT kt.*, kd.designation_name
       FROM kpi_templates kt
       JOIN kpi_designations kd ON kt.designation_id = kd.id
       WHERE kt.designation_id = ? AND kt.is_active = TRUE
       ORDER BY kt.display_order`,
      [designationId]
    );

    return NextResponse.json({ templates: rows });
  } catch (error: any) {
    console.error("GET /api/employee/kpi-templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}