// app/api/employee/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

type GoalWithAppraisalMeta = {
  id: number;
  appraisal_id: number;
  goal_no: number;
  area: string | null;
  area_id: number | null;
  kpi: string | null;
  description: string | null;
  metric: string | null;
  target: string | null;
  expected_monthly: string | null;
  timeline: string | null;
  weight: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  is_custom: number;
  goals_approved_at: string | null;
};

type InsertResult = {
  insertId: number;
};

type IdRow = {
  id: number;
};

// PUT — update a goal
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Verify ownership: goal belongs to this user's appraisal
    const [goalRows] = await pool.query(
      `SELECT eg.*, ea.employee_id, ea.goals_approved_at, ea.goals_submitted_at
       FROM employee_goals eg
       JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
       WHERE eg.id = ? AND ea.employee_id = ? AND eg.is_deleted = 0`,
      [id, user.id]
    );
    const goal = (goalRows as GoalWithAppraisalMeta[])[0];
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    // Can only edit draft goals, not approved ones
    if (goal.status === "submitted") {
      return NextResponse.json({ error: "Cannot edit submitted goals awaiting manager approval" }, { status: 403 });
    }

    if (goal.status === "approved") {
      return NextResponse.json({ error: "Cannot edit approved goals" }, { status: 403 });
    }
    if (goal.goals_approved_at) {
      return NextResponse.json({ error: "Goals already approved by manager" }, { status: 403 });
    }

    const body = await req.json();
    const { area, area_id, kpi, description, metric, target, expected_monthly, timeline, weight, status } = body || {};

    const nextArea = area !== undefined ? area : goal.area;
    const nextAreaId = area_id !== undefined ? area_id : goal.area_id;
    const nextKpi = kpi !== undefined ? kpi : goal.kpi;
    const nextDescription = description !== undefined ? description : goal.description;
    const nextMetric = metric !== undefined ? metric : goal.metric;
    const nextTarget = target !== undefined ? target : goal.target;
    const nextExpectedMonthly = expected_monthly !== undefined ? expected_monthly : goal.expected_monthly;
    const nextTimeline = timeline !== undefined ? timeline : goal.timeline;
    const nextWeight = weight !== undefined ? weight : goal.weight;
    const nextStatus = status !== undefined ? status : goal.status;

    await pool.query(
      `UPDATE employee_goals 
       SET area = ?, area_id = ?, kpi = ?, description = ?, metric = ?, target = ?, expected_monthly = ?, timeline = ?, weight = ?, status = ?
       WHERE id = ?`,
      [
        nextArea || null,
        nextAreaId || null,
        nextKpi || null,
        nextDescription || null,
        nextMetric || null,
        nextTarget || null,
        nextExpectedMonthly || null,
        nextTimeline || null,
        nextWeight || 0,
        nextStatus,
        id,
      ]
    );

    const [updated] = await pool.query(
      `SELECT eg.*, ga.area_name
       FROM employee_goals eg
       LEFT JOIN goal_areas ga ON eg.area_id = ga.id
       WHERE eg.id = ? AND eg.is_deleted = 0`,
      [id]
    );

    return NextResponse.json({ goal: (updated as GoalWithAppraisalMeta[])[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/employee/goals/[id] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remove a goal
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Verify ownership and check status (row lock for safe replace flow)
      const [goalRows] = await conn.query(
        `SELECT eg.*, ea.employee_id, ea.goals_approved_at, ea.goals_submitted_at
         FROM employee_goals eg
         JOIN employee_appraisals ea ON eg.appraisal_id = ea.id
         WHERE eg.id = ? AND ea.employee_id = ? AND eg.is_deleted = 0
         FOR UPDATE`,
        [id, user.id]
      );
      const goal = (goalRows as GoalWithAppraisalMeta[])[0];
      if (!goal) {
        await conn.rollback();
        return NextResponse.json({ error: "Goal not found" }, { status: 404 });
      }

      if (goal.status === "approved") {
        await conn.rollback();
        return NextResponse.json({ error: "Cannot delete approved goals" }, { status: 403 });
      }

      if (goal.status === "submitted") {
        await conn.rollback();
        return NextResponse.json({ error: "Cannot delete submitted goals awaiting approval" }, { status: 403 });
      }

      // Requirement: when removing a prefilled goal, soft-delete it and place a new custom goal
      // in the same slot for this appraisal (to be approved via normal manager approval flow).
      const shouldReplaceWithCustom = !goal.is_custom;

      await conn.query("UPDATE employee_goals SET is_deleted = 1 WHERE id = ?", [id]);

      let replacementGoalId: number | null = null;
      if (shouldReplaceWithCustom) {
        const [ins] = await conn.query(
          `INSERT INTO employee_goals
           (appraisal_id, goal_no, area, area_id, kpi, description, metric, target, expected_monthly, timeline, weight, status, is_custom, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, 0)`,
          [
            goal.appraisal_id,
            goal.goal_no,
            goal.area || "Custom",
            goal.area_id || null,
            "Custom Goal",
            "Custom Goal",
            null,
            null,
            null,
            goal.timeline || null,
            goal.weight || 0,
          ]
        );
        replacementGoalId = Number((ins as InsertResult).insertId || 0) || null;
      } else {
        // If user deletes an existing custom goal, then resequence goal numbers.
        const [remaining] = await conn.query(
          "SELECT id FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0 ORDER BY goal_no",
          [goal.appraisal_id]
        );
        const remainingGoals = remaining as IdRow[];
        for (let i = 0; i < remainingGoals.length; i++) {
          await conn.query("UPDATE employee_goals SET goal_no = ? WHERE id = ?", [i + 1, remainingGoals[i].id]);
        }
      }

      await conn.commit();

      const [goals] = await pool.query(
        "SELECT * FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0 ORDER BY goal_no",
        [goal.appraisal_id]
      );

      return NextResponse.json({ success: true, goals, replacementGoalId });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/employee/goals/[id] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
