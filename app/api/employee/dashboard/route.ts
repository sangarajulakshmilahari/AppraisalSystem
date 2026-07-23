// app/api/employee/dashboard/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

function formatDate(d: any): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) {
      return NextResponse.json({
        hasCycle: false,
        message: "No active appraisal cycle at the moment.",
      });
    }

    const { cycle, appraisal } = active;
    const pool = getPool();

    // ── Goal stats ──
    const [goals] = await pool.query(
      "SELECT id, status, weight FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0",
      [appraisal.id]
    );
    const goalCount = (goals as any[]).length;
    const goalsApproved = (goals as any[]).filter((g) => g.status === "approved").length;
    const goalsSubmitted = (goals as any[]).filter((g) => g.status === "submitted").length;

    let goalStatusText = "Not started";
    let goalStatusColor = "#6b7280";
    if (appraisal.goals_approved_at) {
      goalStatusText = `${goalCount} / ${goalCount} Approved`;
      goalStatusColor = "#10b981";
    } else if (appraisal.goals_submitted_at) {
      goalStatusText = "Submitted — Awaiting approval";
      goalStatusColor = "#1d4ed8";
    } else if (goalCount > 0) {
      goalStatusText = `${goalCount} draft`;
      goalStatusColor = "#f59e0b";
    }

    // ── Self Assessment stats ──
    const [saGoals] = await pool.query(
      "SELECT self_assessment FROM employee_goals WHERE appraisal_id = ? AND is_deleted = 0",
      [appraisal.id]
    );
    const saFilled = (saGoals as any[]).filter((g) => g.self_assessment && g.self_assessment.trim()).length;

    let saStatusText = "Not started";
    let saStatusColor = "#6b7280";
    if (appraisal.self_assessment_submitted_at) {
      saStatusText = "Submitted";
      saStatusColor = "#10b981";
    } else if (saFilled > 0) {
      saStatusText = `${saFilled} / ${goalCount} filled`;
      saStatusColor = "#f59e0b";
    }

    // ── Competency stats ──
    const [comps] = await pool.query(
      "SELECT self_rating FROM employee_competencies WHERE appraisal_id = ?",
      [appraisal.id]
    );
    const compTotal = (comps as any[]).length;
    const compRated = (comps as any[]).filter((c) => c.self_rating !== null).length;

    let compStatusText = "Not started";
    let compStatusColor = "#6b7280";
    if (appraisal.competency_submitted_at) {
      compStatusText = "Submitted";
      compStatusColor = "#10b981";
    } else if (compRated > 0) {
      compStatusText = `${compRated} / ${compTotal} rated`;
      compStatusColor = "#f59e0b";
    }

    // ── Development Plan stats ──
    const [devPlans] = await pool.query(
      "SELECT status FROM employee_development_plans WHERE employee_id = ?",
      [user.id]
    );
    const devTotal = (devPlans as any[]).length;
    const devCompleted = (devPlans as any[]).filter((d) => d.status === "completed").length;

    // ── Phase progress ──
    const phases = [
      { name: "Goal Setting", key: "goal_setting" },
      { name: "Self Assessment", key: "self_assessment" },
      { name: "Competency", key: "competency_assessment" },
      { name: "Manager Review", key: "manager_review" },
      { name: "HR Review", key: "hr_review" },
      { name: "Completed", key: "completed" },
    ];
    const phaseOrder = phases.map((p) => p.key);
    const currentIdx = phaseOrder.indexOf(appraisal.current_phase);

    // ── Overall progress percentage ──
    const totalPhases = phases.length;
    const progressPct = Math.round(((currentIdx + 1) / totalPhases) * 100);

    // ── Pending actions ──
    const pendingActions: { id: number; title: string; due: string; urgent: boolean; href: string }[] = [];
    let actionId = 1;

    if (!appraisal.goals_submitted_at && !appraisal.goals_approved_at) {
      pendingActions.push({
        id: actionId++,
        title: goalCount > 0 ? "Submit your goals for approval" : "Set your performance goals",
        due: formatDate(cycle.goal_setting_end) || "—",
        urgent: true,
        href: "/webpage/employee/goals",
      });
    }

    if (appraisal.goals_approved_at && !appraisal.self_assessment_submitted_at) {
      pendingActions.push({
        id: actionId++,
        title: "Complete Self Assessment",
        due: formatDate(cycle.self_assessment_end) || "—",
        urgent: true,
        href: "/webpage/employee/self-assessment",
      });
    }

    if (appraisal.self_assessment_submitted_at && !appraisal.competency_submitted_at) {
      pendingActions.push({
        id: actionId++,
        title: "Complete Competency Assessment",
        due: formatDate(cycle.competency_end) || "—",
        urgent: true,
        href: "/webpage/employee/competency",
      });
    }

    if (devTotal === 0) {
      pendingActions.push({
        id: actionId++,
        title: "Create your Development Plan",
        due: "Anytime",
        urgent: false,
        href: "/webpage/employee/development-plan",
      });
    }

    if (appraisal.current_phase === "completed" && !appraisal.acknowledged) {
      pendingActions.push({
        id: actionId++,
        title: "Acknowledge Appraisal Results",
        due: "Required",
        urgent: true,
        href: "/webpage/employee/feedback",
      });
    }

    return NextResponse.json({
      hasCycle: true,
      cycle: {
        id: cycle.id,
        name: cycle.cycle_name,
        periodStart: formatDate(cycle.period_start),
        periodEnd: formatDate(cycle.period_end),
        currentPhase: appraisal.current_phase,
      },
      progress: progressPct,
      phases: phases.map((p, i) => ({
        name: p.name,
        status: i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming",
      })),
      stats: [
        { label: "Goals Set", value: goalStatusText, color: goalStatusColor },
        { label: "Self Assessment", value: saStatusText, color: saStatusColor },
        { label: "Competency", value: compStatusText, color: compStatusColor },
        { label: "Overall Progress", value: `${progressPct}%`, color: "#7c3aed" },
      ],
      pendingActions,
      devPlan: { total: devTotal, completed: devCompleted },
    });
  } catch (error: any) {
    console.error("GET /api/employee/dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
