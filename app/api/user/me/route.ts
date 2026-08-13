// app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "../../lib/db";
import type { RowDataPacket } from "mysql2/promise";

type AaramEmployeeRow = RowDataPacket & {
  id: number;
  keycloak_id: string;
  name: string;
  email: string;
  role: string | null;
};

type MeRoleRow = RowDataPacket & {
  role_id: number;
  role_name: string;
  description: string | null;
};

type MeRoleDto = {
  role_id: number;
  role_name: string;
  description: string | null;
  display_name?: string;
};

function mapAaramRoleToAppRoles(aaramRole: string | null): MeRoleDto[] {
  const normalized = (aaramRole || "").trim().toLowerCase();

  // Business mapping:
  // - AARAM 'Manager' (Team Lead) => app 'Manager'
  // - AARAM 'R_Manager'           => app 'Manager'
  if (
    normalized === "manager" ||
    normalized === "r_manager" ||
    normalized === "team lead" ||
    normalized === "team_lead" ||
    normalized === "teamlead"
  ) {
    return [{
      role_id: 2,
      role_name: "Manager",
      description: "Reporting manager",
      display_name: normalized === "r_manager" ? "Manager" : "Team Lead",
    }];
  }

  if (normalized === "hr" || normalized === "hr_admin") {
    return [{ role_id: 3, role_name: "HR Admin", description: "HR administrator" }];
  }

  return [{ role_id: 1, role_name: "Employee", description: "Regular employee" }];
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const keycloakId = cookieStore.get("keycloak_id")?.value;

    if (!keycloakId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const pool = getPool();

    // Resolve logged-in user from AARAM only
    const [rows] = await pool.query<AaramEmployeeRow[]>(
      `SELECT id, keycloak_id, name, email, role
       FROM aaram_db.employee
       WHERE keycloak_id = ?
       LIMIT 1`,
      [keycloakId]
    );

    const employee = rows[0];
    if (!employee) {
      return NextResponse.json(
        { error: "User not found in aaram_db.employee" },
        { status: 404 }
      );
    }

    const roleRows = mapAaramRoleToAppRoles(employee.role);

    return NextResponse.json({
      id: employee.id,
      keycloakId: employee.keycloak_id,
      username: employee.name,
      email: employee.email,
      roles: roleRows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/user/me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user", details: message },
      { status: 500 }
    );
  }
}
