// app/api/employee/competencies/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

const TEAM_LEAD_COMPETENCY_COLUMNS = [
  "team_lead_feedback",
  "teamlead_feedback",
  "lead_feedback",
  "reviewer_feedback",
] as const;

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
    if (!active) return NextResponse.json({ competencies: [], cycle: null, appraisal: null });

    const { cycle, appraisal } = active;
    const pool = getPool();

    const [teamLeadColumnRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_competencies'
         AND COLUMN_NAME IN (${TEAM_LEAD_COMPETENCY_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_COMPETENCY_COLUMNS]
    );
    const availableTeamLeadColumns = new Set((teamLeadColumnRows as any[]).map((r) => String(r.COLUMN_NAME)));
    const teamLeadColumn = TEAM_LEAD_COMPETENCY_COLUMNS.find((c) => availableTeamLeadColumns.has(c));
    const teamLeadSelect = teamLeadColumn
      ? `ec.${teamLeadColumn} AS team_lead_assessment`
      : "NULL AS team_lead_assessment";

    // Get all active competency areas
    const [areas] = await pool.query(
      "SELECT * FROM competency_areas WHERE is_active = TRUE ORDER BY display_order"
    );

    // Get existing ratings for this appraisal
    const [ratings] = await pool.query(
      "SELECT * FROM employee_competencies WHERE appraisal_id = ?",
      [appraisal.id]
    );
    const ratingMap = new Map(
      (ratings as any[]).map((r) => [r.competency_id, r])
    );

    // Auto-create employee_competencies rows if they don't exist yet
    for (const area of areas as any[]) {
      if (!ratingMap.has(area.id)) {
        await pool.query(
          `INSERT INTO employee_competencies (appraisal_id, competency_id)
           VALUES (?, ?)`,
          [appraisal.id, area.id]
        );
      }
    }

    // Re-fetch after potential inserts
    const [allRatings] = await pool.query(
      `SELECT ec.id, ec.competency_id, ec.self_rating, ec.manager_rating, ec.manager_feedback,
               ec.team_lead_rating,
               ${teamLeadSelect},
                 ca.area_name, ca.expected_behaviour, ca.display_order
        FROM employee_competencies ec
        JOIN competency_areas ca ON ec.competency_id = ca.id
        WHERE ec.appraisal_id = ?
        ORDER BY ca.display_order`,
      [appraisal.id]
    );

    // Window check
    const competencyWindowOpen = isWindowOpen(cycle.competency_start, cycle.competency_end);
    const competencyEditable = competencyWindowOpen && !appraisal.competency_submitted_at;

    return NextResponse.json({
      competencies: allRatings,
      cycle: {
        id: cycle.id,
        name: cycle.cycle_name,
        competencyWindowOpen,
        competencyStart: formatDate(cycle.competency_start),
        competencyEnd: formatDate(cycle.competency_end),
      },
      appraisal: {
        id: appraisal.id,
        currentPhase: appraisal.current_phase,
        competencySubmittedAt: appraisal.competency_submitted_at,
      },
      competencyEditable,
    });
  } catch (error: any) {
    console.error("GET /api/employee/competencies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
