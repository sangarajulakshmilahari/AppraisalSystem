
// app/api/employee/self-assessment/submit/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../../lib/getuser";
import { notifyAppraisalSubmission } from "../../../lib/notifyAppraisalSubmission";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ error: "No active appraisal cycle" }, { status: 400 });

    const { appraisal, cycle } = active;

    if (appraisal.self_assessment_submitted_at) {
      return NextResponse.json({ error: "Self assessment already submitted" }, { status: 400 });
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [lockedRows] = await conn.query(
        "SELECT self_assessment_submitted_at FROM employee_appraisals WHERE id = ? FOR UPDATE",
        [appraisal.id]
      );
      const locked = (lockedRows as { self_assessment_submitted_at: Date | string | null }[])[0];
      if (!locked) {
        await conn.rollback();
        return NextResponse.json({ error: "No active appraisal cycle" }, { status: 400 });
      }
      if (locked.self_assessment_submitted_at) {
        await conn.rollback();
        return NextResponse.json({ error: "Self assessment already submitted" }, { status: 400 });
      }

      // Check all goals have self_assessment filled
      const [goals] = await conn.query(
        "SELECT id, self_assessment FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0",
        [appraisal.id]
      );

      if ((goals as any[]).length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "No goals found" }, { status: 400 });
      }

      const unfilled = (goals as any[]).filter(
        (g: { self_assessment?: string | null }) => !g.self_assessment || g.self_assessment.trim() === ""
      );

      if (unfilled.length > 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: `Please fill self-assessment for all ${(goals as any[]).length} goals. ${unfilled.length} remaining.` },
          { status: 400 }
        );
      }

      // Update appraisal: mark submitted, advance phase
      await conn.query(
        `UPDATE employee_appraisals 
         SET self_assessment_submitted_at = NOW(),
             current_phase = 'competency_assessment'
         WHERE id = ?`,
        [appraisal.id]
      );

      await conn.commit();
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }

    try {
      await notifyAppraisalSubmission({
        pool,
        notificationType: "SELF_ASSESSMENT_SUBMISSION",
        employeeKeycloakId: user.keycloak_id,
        employeeUsername: user.username,
        appraisalId: appraisal.id,
        cycleName: (cycle as { cycle_name?: string }).cycle_name || "Appraisal Cycle",
        fallbackManagerUserId: appraisal.manager_id ?? null,
      });
    } catch (notifyError) {
      console.error("POST /api/employee/self-assessment/submit notification error:", notifyError);
    }

    return NextResponse.json({
      success: true,
      message: "Self-Assessment submitted successfully. Your Team Lead and Manager have been notified.",
    });
  } catch (error: any) {
    console.error("POST /api/employee/self-assessment/submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
