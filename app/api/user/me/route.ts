// app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "../../lib/db";
import type { RowDataPacket } from "mysql2/promise";

type MeUserRow = RowDataPacket & {
  id: number;
  keycloak_id: string;
  username: string;
  email: string;
};

type MeRoleRow = RowDataPacket & {
  role_id: number;
  role_name: string;
  description: string | null;
};

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
    let userRow: MeUserRow | null = null;

    // 1. Lookup only by keycloak_id
    const [rows] = await pool.query<MeUserRow[]>(
      "SELECT id, keycloak_id, username, email FROM users WHERE keycloak_id = ?",
      [keycloakId]
    );
    if (rows.length > 0) userRow = rows[0];

    if (!userRow) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // 2. Fetch all roles assigned to this user
    const [roleRows] = await pool.query<MeRoleRow[]>(
      `SELECT r.role_id, r.role_name, r.description 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.role_id 
       WHERE ur.user_id = ? 
       ORDER BY r.role_id`,
      [userRow.id]
    );

    return NextResponse.json({
      id: userRow.id,
      keycloakId: userRow.keycloak_id,
      username: userRow.username,
      email: userRow.email,
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
