// app/api/employee/evidence/[goalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

// GET — fetch evidence rows for a specific goal
export async function GET(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const { goalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership
    const [goalRows] = await pool.query(
      `SELECT eg.id FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND ea.employee_id = ? AND eg.is_deleted = 0`,
      [goalId, user.id]
    );
    if ((goalRows as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const [evidence] = await pool.query(
      "SELECT * FROM goal_evidence WHERE goal_id = ? ORDER BY id",
      [goalId]
    );

    return NextResponse.json({ evidence });
  } catch (error: any) {
    console.error("GET /api/employee/evidence/[goalId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — add a new evidence row (max 12 per goal)
export async function POST(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const { goalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership and check SA not submitted
    const [goalRows] = await pool.query(
      `SELECT eg.id, ea.self_assessment_submitted_at
       FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND ea.employee_id = ? AND eg.is_deleted = 0`,
      [goalId, user.id]
    );
    const goal = (goalRows as any[])[0];
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.self_assessment_submitted_at) {
      return NextResponse.json({ error: "Self assessment already submitted" }, { status: 403 });
    }

    // Check max 12
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as cnt FROM goal_evidence WHERE goal_id = ?",
      [goalId]
    );
    if ((countRows as any[])[0].cnt >= 12) {
      return NextResponse.json({ error: "Maximum 12 evidence rows per goal" }, { status: 400 });
    }

    const body = await req.json();
    const { month, description } = body;

    if (!month) {
  return NextResponse.json({ error: "Month is required" }, { status: 400 });
}

    const [result] = await pool.query(
      "INSERT INTO goal_evidence (goal_id, month, description) VALUES (?, ?, ?)",
      [goalId, month, description]
    );

    const [newRow] = await pool.query(
      "SELECT * FROM goal_evidence WHERE id = ?",
      [(result as any).insertId]
    );

    return NextResponse.json({ evidence: (newRow as any[])[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employee/evidence/[goalId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
