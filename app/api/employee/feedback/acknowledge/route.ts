// app/api/employee/feedback/acknowledge/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../../lib/getuser";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ error: "No active appraisal cycle" }, { status: 400 });

    const { appraisal } = active;

    if (appraisal.acknowledged) {
      return NextResponse.json({ error: "Already acknowledged" }, { status: 400 });
    }

    const pool = getPool();

    await pool.query(
      `UPDATE employee_appraisals 
       SET acknowledged = TRUE, acknowledged_at = NOW()
       WHERE id = ?`,
      [appraisal.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/employee/feedback/acknowledge error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}