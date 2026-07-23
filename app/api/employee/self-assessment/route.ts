// app/api/employee/self-assessment/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

function normalizeLabel(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

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

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const active = await getActiveAppraisal(user.id);
    if (!active) return NextResponse.json({ goals: [], cycle: null, appraisal: null });

    const { cycle, appraisal } = active;
    const pool = getPool();

    // Fetch goals
    const [goals] = await pool.query(
      `SELECT eg.id, eg.goal_no, eg.area, eg.kpi, eg.description, eg.sa_kpi_label,
               eg.self_assessment, eg.manager_feedback, eg.performance_rating
       FROM employee_goals eg
       WHERE eg.appraisal_id = ? AND eg.is_deleted = 0
       ORDER BY eg.goal_no`,
      [appraisal.id]
    );

    // Fetch evidence for each goal
    const goalIds = (goals as any[]).map((g) => g.id);
    let evidenceMap: Record<number, any[]> = {};
    if (goalIds.length > 0) {
      const [evidence] = await pool.query(
        "SELECT * FROM goal_evidence WHERE goal_id IN (?) ORDER BY id",
        [goalIds]
      );
      for (const ev of evidence as any[]) {
        if (!evidenceMap[ev.goal_id]) evidenceMap[ev.goal_id] = [];
        evidenceMap[ev.goal_id].push(ev);
      }
    }

    // Fetch dropdown options for this designation
    let dropdownMap: Record<string, any[]> = {};
    if (appraisal.designation_id) {
      const [options] = await pool.query(
        `SELECT kpi_label, option_order, option_text 
         FROM kpi_self_assessment_options 
         WHERE designation_id = ? 
         ORDER BY kpi_label, option_order`,
        [appraisal.designation_id]
      );
      for (const opt of options as any[]) {
        const key = normalizeLabel(opt.kpi_label);
        if (!key) continue;
        if (!dropdownMap[key]) dropdownMap[key] = [];
        dropdownMap[key].push({
          order: opt.option_order,
          text: opt.option_text,
        });
      }
    }

    // Attach evidence and dropdown options to each goal
    const goalsWithData = (goals as any[]).map((g) => ({
      ...g,
      evidence: evidenceMap[g.id] || [],
      dropdownOptions: (() => {
        const candidates = [g.sa_kpi_label, g.kpi]
          .map((v) => normalizeLabel(v))
          .filter(Boolean);

        for (const c of candidates) {
          if (dropdownMap[c]?.length) return dropdownMap[c];
        }
        return [];
      })(),
    }));

    const saStart = cycle.self_assessment_start ? new Date(cycle.self_assessment_start) : null;
    const saEnd = cycle.self_assessment_end ? new Date(cycle.self_assessment_end) : null;
    if (saStart) saStart.setHours(0, 0, 0, 0);
    if (saEnd) saEnd.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const saWindowOpen = !!(saStart && saEnd && today >= saStart && today <= saEnd);
    const saEditable = saWindowOpen && !appraisal.self_assessment_submitted_at;

    return NextResponse.json({
      goals: goalsWithData,
      cycle: {
        id: cycle.id,
        name: cycle.cycle_name,
        saWindowOpen,
        selfAssessmentStart: formatDate(cycle.self_assessment_start),
        selfAssessmentEnd: formatDate(cycle.self_assessment_end),
      },
      appraisal: {
        id: appraisal.id,
        currentPhase: appraisal.current_phase,
        selfAssessmentSubmittedAt: appraisal.self_assessment_submitted_at,
        designationId: appraisal.designation_id,
      },
      saEditable,
    });
  } catch (error: any) {
    console.error("GET /api/employee/self-assessment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
