// app/api/employee/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

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
      `SELECT id, goal_no, area, kpi, description, metric, target, expected_monthly, 
              timeline, weight, status, self_assessment, manager_feedback, performance_rating
       FROM employee_goals
       WHERE appraisal_id = ?
       ORDER BY goal_no`,
      [appraisal.id]
    );

    let designation = null;
    if (appraisal.designation_id) {
      const [desRows] = await pool.query(
        "SELECT id, designation_name FROM kpi_designations WHERE id = ?",
        [appraisal.designation_id]
      );
      if ((desRows as any[]).length > 0) designation = (desRows as any[])[0];
    }

    const goalWindowOpen = isWindowOpen(cycle.goal_setting_start, cycle.goal_setting_end);
    const goalsEditable = goalWindowOpen && !appraisal.goals_approved_at;

    return NextResponse.json({
      goals,
      cycle: {
        id: cycle.id,
        name: cycle.cycle_name,
        goalWindowOpen,
        goalSettingStart: formatDate(cycle.goal_setting_start),
        goalSettingEnd: formatDate(cycle.goal_setting_end),
      },
      appraisal: {
        id: appraisal.id,
        currentPhase: appraisal.current_phase,
        goalsSubmittedAt: appraisal.goals_submitted_at,
        goalsApprovedAt: appraisal.goals_approved_at,
        designationId: appraisal.designation_id,
      },
      designation,
      goalsEditable,
    });
  } catch (error: any) {
    console.error("GET /api/employee/goals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — load goals from KPI template
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ error: "No active appraisal cycle" }, { status: 400 });

    const { appraisal } = active;
    if (appraisal.goals_approved_at) {
      return NextResponse.json({ error: "Goals already approved" }, { status: 403 });
    }

    const body = await req.json();
    const { designation_id } = body;
    if (!designation_id) return NextResponse.json({ error: "Designation is required" }, { status: 400 });

    const pool = getPool();

    const [templates] = await pool.query(
      "SELECT * FROM kpi_templates WHERE designation_id = ? AND is_active = TRUE ORDER BY display_order",
      [designation_id]
    );

    if ((templates as any[]).length === 0) {
      return NextResponse.json({ error: "No KPI templates found" }, { status: 404 });
    }

    // Delete existing draft goals
    await pool.query(
      "DELETE FROM employee_goals WHERE appraisal_id = ? AND status = 'draft'",
      [appraisal.id]
    );

    // Insert from templates — keep area and kpi as separate columns
    let goalNo = 1;
    for (const t of templates as any[]) {
      await pool.query(
        `INSERT INTO employee_goals 
         (appraisal_id, goal_no, area, kpi, description, metric, target, expected_monthly, weight, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [
          appraisal.id,
          goalNo++,
          t.area || null,
          t.kpi || null,
          [t.area, t.kpi].filter(Boolean).join(" — "), // description as fallback
          t.metric || null,
          t.target || null,
          t.target || null, // expected_monthly defaults to target
          t.weight || 0,
        ]
      );
    }

    await pool.query(
      "UPDATE employee_appraisals SET designation_id = ? WHERE id = ?",
      [designation_id, appraisal.id]
    );

    const [goals] = await pool.query(
      "SELECT * FROM employee_goals WHERE appraisal_id = ? ORDER BY goal_no",
      [appraisal.id]
    );

    return NextResponse.json({ goals }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employee/goals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}