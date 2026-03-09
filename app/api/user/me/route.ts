// app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "../../lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const keycloakId = cookieStore.get("keycloak_id")?.value;
    const sessionUser = cookieStore.get("user")?.value
      ? decodeURIComponent(cookieStore.get("user")!.value)
      : null;

    const pool = getPool();
    let userRow: any = null;

    // 1. Try lookup by keycloak_id (most reliable)
    if (keycloakId) {
      const [rows] = await pool.query(
        "SELECT id, keycloak_id, username, email FROM users WHERE keycloak_id = ?",
        [keycloakId]
      );
      const users = rows as any[];
      if (users.length > 0) userRow = users[0];
    }

    // 2. Fallback: lookup by username or email from the user cookie
    if (!userRow && sessionUser) {
      const [rows] = await pool.query(
        "SELECT id, keycloak_id, username, email FROM users WHERE username = ? OR email = ?",
        [sessionUser, sessionUser]
      );
      const users = rows as any[];
      if (users.length > 0) userRow = users[0];
    }

    if (!userRow) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // 3. Fetch all roles assigned to this user
    const [roleRows] = await pool.query(
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
  } catch (error: any) {
    console.error("GET /api/user/me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user", details: error.message },
      { status: 500 }
    );
  }
}   