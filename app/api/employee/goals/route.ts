// app/api/employee/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

// Helper: compare dates properly (MySQL returns Date objects)
function isWindowOpen(start: any, end: any): boolean {
  if (!start || !end) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(23, 59, 59, 999);
  return today >= s && today <= e;
}

function formatDate(d: any): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// GET — fetch all goals for the active cycle
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ goals: [], cycle: null, appraisal: null });

    const { cycle, appraisal } = active;
    const pool = getPool();

    const [goals] = await pool.query(
      `SELECT eg.*, ga.area_name
       FROM employee_goals eg
       LEFT JOIN goal_areas ga ON eg.area_id = ga.id
       WHERE eg.appraisal_id = ?
       ORDER BY eg.goal_no`,
      [appraisal.id]
    );

    const goalWindowOpen = isWindowOpen(cycle.goal_setting_start, cycle.goal_setting_end);
    const goalsEditable = goalWindowOpen && !appraisal.goals_approved_at;

    return NextResponse.json({
      goals,
      cycle: {
        id: cycle.id,
        name: cycle.cycle_name,
        periodStart: cycle.period_start,
        periodEnd: cycle.period_end,
        goalWindowOpen,
        goalSettingStart: formatDate(cycle.goal_setting_start),
        goalSettingEnd: formatDate(cycle.goal_setting_end),
      },
      appraisal: {
        id: appraisal.id,
        currentPhase: appraisal.current_phase,
        goalsSubmittedAt: appraisal.goals_submitted_at,
        goalsApprovedAt: appraisal.goals_approved_at,
      },
      goalsEditable,
    });
  } catch (error: any) {
    console.error("GET /api/employee/goals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — add a new goal
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ error: "No active appraisal cycle" }, { status: 400 });

    const { appraisal } = active;

    if (appraisal.goals_approved_at) {
      return NextResponse.json({ error: "Goals already approved, cannot add" }, { status: 403 });
    }

    const body = await req.json();
    const { area_id, description, metric, target, timeline, weight } = body;

    if (!description?.trim()) {
      return NextResponse.json({ error: "Goal description is required" }, { status: 400 });
    }

    const pool = getPool();

    const [maxRows] = await pool.query(
      "SELECT COALESCE(MAX(goal_no), 0) + 1 as next_no FROM employee_goals WHERE appraisal_id = ?",
      [appraisal.id]
    );
    const nextNo = (maxRows as any[])[0].next_no;

    const [result] = await pool.query(
      `INSERT INTO employee_goals (appraisal_id, goal_no, area_id, description, metric, target, timeline, weight, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [appraisal.id, nextNo, area_id || null, description, metric || null, target || null, timeline || null, weight || 0]
    );

    const [newGoal] = await pool.query(
      `SELECT eg.*, ga.area_name
       FROM employee_goals eg
       LEFT JOIN goal_areas ga ON eg.area_id = ga.id
       WHERE eg.id = ?`,
      [(result as any).insertId]
    );

    return NextResponse.json({ goal: (newGoal as any[])[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employee/goals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}