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

// GET
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ goals: [], cycle: null, appraisal: null });

    const { cycle, appraisal } = active;
    const pool = getPool();

    let designation = null;
    let resolvedDesignationId: number | null = appraisal.designation_id ? Number(appraisal.designation_id) : null;

    if (appraisal.designation_id) {
      const [desRows] = await pool.query(
        "SELECT id, designation_name FROM kpi_designations WHERE id = ?",
        [appraisal.designation_id]
      );
      if ((desRows as any[]).length > 0) designation = (desRows as any[])[0];
    }

    // Keep designation selection manual via dropdown.
    // Do not auto-resolve project role/designation from external AARAM mapping.
    if (!resolvedDesignationId && appraisal.designation_id) {
      resolvedDesignationId = Number(appraisal.designation_id);
    }

    // Auto-load goals when none exist yet for this appraisal and designation is known.
    // This handles both first-time users and cases where goals were never seeded.
    const [existingGoals] = await pool.query(
      "SELECT id FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0",
      [appraisal.id]
    );

    if ((existingGoals as any[]).length === 0 && resolvedDesignationId) {
      await loadGoalsFromTemplate(pool, appraisal.id, resolvedDesignationId);
    }

    const [goals] = await pool.query(
      `SELECT id, goal_no, area, kpi, description, metric, target, expected_monthly, sa_kpi_label,
              timeline, weight, status, self_assessment, manager_feedback, performance_rating,
              is_custom, created_by
       FROM employee_goals
       WHERE appraisal_id = ? AND is_deleted = 0
       ORDER BY goal_no`,
      [appraisal.id]
    );

    const goalWindowOpen = isWindowOpen(cycle.goal_setting_start, cycle.goal_setting_end);
    const goalsEditable = goalWindowOpen && !appraisal.goals_submitted_at && !appraisal.goals_approved_at;

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

// POST — load/reload from template
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

    if (appraisal.goals_submitted_at) {
      return NextResponse.json({ error: "Goals already submitted and pending manager approval" }, { status: 403 });
    }

    const body = await req.json();
    const { designation_id, action } = body || {};

    const pool = getPool();

    // add custom goal (draft)
    if (action === "add_custom_goal") {
      const nextGoalNo = await getNextGoalNo(pool, appraisal.id);
      await pool.query(
        `INSERT INTO employee_goals
         (appraisal_id, goal_no, area, kpi, description, metric, target, expected_monthly, sa_kpi_label, timeline, weight, status, is_custom, is_deleted, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, 0, 'employee')`,
        [
          appraisal.id,
          nextGoalNo,
          "Custom",
          "Custom Goal",
          "Custom Goal",
          null,
          null,
          null,
          null,
          null,
          0,
        ]
      );

      const [goals] = await pool.query(
        "SELECT * FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0 ORDER BY goal_no",
        [appraisal.id]
      );

      return NextResponse.json({ goals }, { status: 201 });
    }

    if (!designation_id) return NextResponse.json({ error: "Designation is required" }, { status: 400 });

    // Soft-delete only draft template goals, keep custom goals untouched.
    await pool.query(
      `UPDATE employee_goals
       SET is_deleted = 1
       WHERE appraisal_id = ? AND status = 'draft' AND is_custom = 0 AND is_deleted = 0`,
      [appraisal.id]
    );

    await loadGoalsFromTemplate(pool, appraisal.id, designation_id);

    await pool.query(
      "UPDATE employee_appraisals SET designation_id = ? WHERE id = ?",
      [designation_id, appraisal.id]
    );

    const [goals] = await pool.query(
      "SELECT * FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0 ORDER BY goal_no",
      [appraisal.id]
    );

    return NextResponse.json({ goals }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employee/goals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — update goal status (accept/reject)
export async function PATCH(req: NextRequest) {
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
    const { goalId, action, reason } = body;

    if (!goalId || !action) {
      return NextResponse.json({ error: "goalId and action are required" }, { status: 400 });
    }

    const pool = getPool();

    // Verify goal belongs to this appraisal
    const [goalRows] = await pool.query(
      "SELECT * FROM employee_goals WHERE id = ? AND appraisal_id = ? AND is_deleted = 0",
      [goalId, appraisal.id]
    );

    if ((goalRows as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goal = (goalRows as any[])[0];

    if (action === "accept") {
      // Employee accepts a goal created by manager
      // Check if goal was created by manager (case-insensitive) and is in draft status
      const isManagerCreated = goal.created_by &&
        (goal.created_by.toLowerCase().includes('manager') ||
         goal.created_by.toLowerCase().includes('mgr') ||
         goal.created_by.toLowerCase().includes('manger'));
      const isDraft = goal.status === 'draft';
      
      console.log('Accept validation:', {
        goalId,
        created_by: goal.created_by,
        status: goal.status,
        isManagerCreated,
        isDraft
      });
      
      if (isManagerCreated && isDraft) {
        await pool.query(
          "UPDATE employee_goals SET status = 'submitted', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
          [user.id, goalId]
        );
      } else {
        return NextResponse.json({
          error: "Cannot accept this goal",
          details: {
            created_by: goal.created_by,
            status: goal.status,
            message: "Only manager-created draft goals can be accepted by employee"
          }
        }, { status: 400 });
      }
    } else if (action === "reject") {
      // Employee rejects a goal created by manager
      // Check if goal was created by manager (case-insensitive) and is in draft status
      const isManagerCreated = goal.created_by &&
        (goal.created_by.toLowerCase().includes('manager') ||
         goal.created_by.toLowerCase().includes('mgr') ||
         goal.created_by.toLowerCase().includes('manger'));
      const isDraft = goal.status === 'draft';
      
      console.log('Reject validation:', {
        goalId,
        created_by: goal.created_by,
        status: goal.status,
        isManagerCreated,
        isDraft
      });
      
      if (isManagerCreated && isDraft) {
        if (!reason) {
          return NextResponse.json({ error: "Reason is required for rejection" }, { status: 400 });
        }
        await pool.query(
          "UPDATE employee_goals SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
          [reason, user.id, goalId]
        );

        // Notify manager if manager_id exists
        if (appraisal.manager_id) {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link_url)
             VALUES (?, 'Goal Rejected', ?, 'warning', '/webpage/manager/team-goals')`,
            [appraisal.manager_id, `Employee ${user.username} rejected goal #${goal.goal_no}. Reason: ${reason}`]
          );
        }
      } else {
        return NextResponse.json({
          error: "Cannot reject this goal",
          details: {
            created_by: goal.created_by,
            status: goal.status,
            message: "Only manager-created draft goals can be rejected by employee"
          }
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const [goals] = await pool.query(
      "SELECT * FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0 ORDER BY goal_no",
      [appraisal.id]
    );

    return NextResponse.json({ goals, success: true });
  } catch (error: any) {
    console.error("PATCH /api/employee/goals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper: insert goals from KPI templates (now includes sa_kpi_label)
async function loadGoalsFromTemplate(pool: any, appraisalId: number, designationId: number) {
  const [templates] = await pool.query(
    "SELECT * FROM kpi_templates WHERE designation_id = ? AND is_active = TRUE ORDER BY display_order",
    [designationId]
  );

  let goalNo = await getNextGoalNo(pool, appraisalId);
  for (const t of templates as any[]) {
    await pool.query(
      `INSERT INTO employee_goals
       (appraisal_id, goal_no, area, kpi, description, metric, target, expected_monthly, sa_kpi_label, weight, status, is_custom, is_deleted, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, 0, 'manager')`,
      [
        appraisalId,
        goalNo++,
        t.area || null,
        t.kpi || null,
        [t.area, t.kpi].filter(Boolean).join(" — "),
        t.metric || null,
        t.target || null,
        t.target || null,
        t.sa_kpi_label || null,
        t.weight || 0,
      ]
    );
  }
}

async function getNextGoalNo(pool: any, appraisalId: number): Promise<number> {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(goal_no), 0) AS max_goal_no FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0",
    [appraisalId]
  );
  return Number((rows as any[])[0]?.max_goal_no || 0) + 1;
}
