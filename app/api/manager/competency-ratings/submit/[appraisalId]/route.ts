// app/api/manager/competency-ratings/submit/[appraisalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/getuser";

const TEAM_LEAD_COMP_SUBMITTED_COLUMNS = [
  "team_lead_competency_submitted_at",
  "teamlead_competency_submitted_at",
  "lead_competency_submitted_at",
] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ appraisalId: string }> }) {
  try {
    const { appraisalId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Resolve appraisal first
    const [rows] = await pool.query("SELECT * FROM employee_appraisals WHERE id = ?", [appraisalId]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const appraisal = (rows as any[])[0];

    // Verify current reviewer owns this employee in AARAM mapping.
    const [managerRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );
    const managerKeycloakId = (managerRows as any[])[0]?.keycloak_id as string | undefined;

    const [employeeRows] = await pool.query(
      "SELECT keycloak_id FROM users WHERE id = ? LIMIT 1",
      [appraisal.employee_id]
    );
    const employeeKeycloakId = (employeeRows as any[])[0]?.keycloak_id as string | undefined;

    if (!managerKeycloakId || !employeeKeycloakId) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const [mapRows] = await pool.query(
      `WITH RECURSIVE reporting_chain AS (
         SELECT erm.employee_id, erm.manager_id, 1 AS lvl
         FROM aaram_db.employee_reporting_managers erm
         UNION ALL
         SELECT rc.employee_id, erm.manager_id, rc.lvl + 1
         FROM reporting_chain rc
         JOIN aaram_db.employee_reporting_managers erm ON erm.employee_id = rc.manager_id
         WHERE rc.lvl < 6
       )
       SELECT 1
       FROM reporting_chain rc
       JOIN aaram_db.employee e ON e.id = rc.employee_id
       JOIN aaram_db.employee m ON m.id = rc.manager_id
       WHERE e.keycloak_id = ? AND m.keycloak_id = ?
       LIMIT 1`,
      [employeeKeycloakId, managerKeycloakId]
    );

    if ((mapRows as any[]).length === 0) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    const [reviewerRoleRows] = await pool.query(
      "SELECT role FROM aaram_db.employee WHERE keycloak_id = ? LIMIT 1",
      [managerKeycloakId]
    );
    const reviewerAaramRole = String((reviewerRoleRows as any[])[0]?.role || "").toLowerCase();
    const isTeamLeadReviewer = reviewerAaramRole === "manager";

    const [hasTeamLeadRows] = await pool.query(
      `SELECT 1
       FROM aaram_db.employee_reporting_managers erm
       JOIN aaram_db.employee e ON e.id = erm.employee_id
       JOIN aaram_db.employee m ON m.id = erm.manager_id
       WHERE e.keycloak_id = ?
         AND LOWER(COALESCE(m.role, '')) = 'manager'
       LIMIT 1`,
      [employeeKeycloakId]
    );
    const hasTeamLead = (hasTeamLeadRows as any[]).length > 0;

    const [teamLeadCompSubmittedColRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'employee_appraisals'
         AND COLUMN_NAME IN (${TEAM_LEAD_COMP_SUBMITTED_COLUMNS.map(() => "?").join(", ")})`,
      [...TEAM_LEAD_COMP_SUBMITTED_COLUMNS]
    );
    const availableTeamLeadCompCols = new Set(
      (teamLeadCompSubmittedColRows as any[]).map((r) => String(r.COLUMN_NAME))
    );
    const teamLeadCompSubmittedCol = TEAM_LEAD_COMP_SUBMITTED_COLUMNS.find((c) =>
      availableTeamLeadCompCols.has(c)
    );

    const teamLeadCompSubmittedAt = teamLeadCompSubmittedCol ? appraisal[teamLeadCompSubmittedCol] : null;

    if (isTeamLeadReviewer) {
      if (!teamLeadCompSubmittedCol) {
        return NextResponse.json(
          { error: "Team Lead competency submit column is not available in employee_appraisals" },
          { status: 400 }
        );
      }
      if (teamLeadCompSubmittedAt) {
        return NextResponse.json({ error: "Already submitted" }, { status: 400 });
      }
    } else {
      if (appraisal.manager_competency_submitted_at) {
        return NextResponse.json({ error: "Already submitted" }, { status: 400 });
      }
      if (hasTeamLead && teamLeadCompSubmittedCol && !teamLeadCompSubmittedAt) {
        return NextResponse.json({ error: "Pending Team Lead competency review" }, { status: 400 });
      }
    }

    // Check all competencies have required reviewer rating
    const ratingColumn = isTeamLeadReviewer ? "team_lead_rating" : "manager_rating";
    const [comps] = await pool.query(
      `SELECT id, ${ratingColumn} AS reviewer_rating FROM employee_competencies WHERE appraisal_id = ?`,
      [appraisalId]
    );

    if ((comps as any[]).length === 0) {
      return NextResponse.json({ error: "No competencies found" }, { status: 400 });
    }

    const unrated = (comps as any[]).filter((c) => c.reviewer_rating === null);
    if (unrated.length > 0) {
      return NextResponse.json(
        { error: `Please rate all competencies. ${unrated.length} of ${(comps as any[]).length} not yet rated.` },
        { status: 400 }
      );
    }

    // Mark submitted
    if (isTeamLeadReviewer) {
      await pool.query(
        `UPDATE employee_appraisals
         SET ${teamLeadCompSubmittedCol} = NOW(),
             current_phase = 'manager_review'
         WHERE id = ?`,
        [appraisalId]
      );
    } else {
      await pool.query(
        "UPDATE employee_appraisals SET manager_competency_submitted_at = NOW() WHERE id = ?",
        [appraisalId]
      );
    }

    // Notify employee
    if (isTeamLeadReviewer) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, 'Team Lead Competency Review Completed', ?, 'info', '/webpage/employee/competency')`,
        [
          appraisal.employee_id,
          `Your Team Lead ${user.username} has completed competency ratings. Manager competency review is pending.`,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, 'Competency Ratings Received', ?, 'success', '/webpage/employee/competency')`,
        [
          appraisal.employee_id,
          `Your manager ${user.username} has completed the competency rating review.`,
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/manager/competency-ratings/submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
