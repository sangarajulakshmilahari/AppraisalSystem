// app/api/employee/profile/route.ts
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

    const pool = getPool();

    // Get user details
    const [userRows] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [user.id]
    );
    const userInfo = (userRows as any[])[0];

    // Get user's roles
    const [roles] = await pool.query(
      `SELECT r.role_name FROM user_roles ur
       JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = ?
       ORDER BY r.role_id`,
      [user.id]
    );

    // Get active appraisal info
    const active = await getActiveAppraisal(user.id);
    let cycleInfo = null;
    let managerName = null;

    if (active) {
      const { cycle, appraisal } = active;
      cycleInfo = {
        cycleName: cycle.cycle_name,
        currentPhase: appraisal.current_phase,
        periodStart: formatDate(cycle.period_start),
        periodEnd: formatDate(cycle.period_end),
      };

      if (appraisal.manager_id) {
        const [mgr] = await pool.query("SELECT username FROM users WHERE id = ?", [appraisal.manager_id]);
        if ((mgr as any[]).length > 0) managerName = (mgr as any[])[0].username;
      }
    }

    return NextResponse.json({
      profile: {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        keycloakId: userInfo.keycloak_id,
        createdAt: formatDate(userInfo.created_at),
        roles: (roles as any[]).map((r) => r.role_name),
        managerName,
      },
      cycle: cycleInfo,
    });
  } catch (error: any) {
    console.error("GET /api/employee/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}