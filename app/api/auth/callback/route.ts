// app/api/auth/callback/route.ts
import { keycloak } from "../../lib/keycloak";
import { getPool } from "../../lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

type ExistingUserRow = RowDataPacket & {
  id: number;
  username: string;
};

type DbRoleRow = RowDataPacket & {
  role_id: number;
  role_name: string;
};

type UsernameRow = RowDataPacket & {
  username: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No authorization code", { status: 400 });
  }

  // Exchange code for token
  const tokenResponse = await fetch(keycloak.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KEYCLOAK_CLIENT_ID!,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
      redirect_uri: process.env.KEYCLOAK_REDIRECT_URI!,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("Token error:", tokenData);
    return new Response("Token exchange failed", { status: 401 });
  }

  // ─── Decode JWT payload ───
  let keycloakId: string | null = null;
  let usernameOrEmail: string | null = null;
  let email: string | null = null;
  let keycloakRoles: string[] = [];
  let cookieUsername: string | null = null;

  try {
    const parts = (tokenData.access_token || "").split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf8")
      );

      keycloakId = payload.sub || null;
      usernameOrEmail = payload.preferred_username || payload.email || null;
      email = payload.email || null;

      // Extract CLIENT-level roles (intraapps) — this is what you have
      const clientId = process.env.KEYCLOAK_CLIENT_ID!;
      if (payload.resource_access?.[clientId]?.roles) {
        keycloakRoles = payload.resource_access[clientId].roles;
      }

      // Also check realm-level roles as fallback
      if (keycloakRoles.length === 0 && payload.realm_access?.roles) {
        keycloakRoles = payload.realm_access.roles.filter(
          (r: string) => !["offline_access", "uma_authorization", "default-roles-adroitent"].includes(r)
        );
      }

      console.log("=== KEYCLOAK LOGIN ===");
      console.log("User:", usernameOrEmail);
      console.log("Keycloak ID:", keycloakId);
      console.log("Roles from token:", keycloakRoles);
    }
  } catch (err) {
    console.error("Failed to decode token payload", err);
  }

  // ─── Auto-sync user & roles to database ───
  if (keycloakId) {
    try {
      const pool = getPool();

      // Step 1: Match ONLY by keycloak_id.
      // Keep DB username as source of truth for existing users.
      const [existingRows] = await pool.query<ExistingUserRow[]>(
        "SELECT id, username FROM users WHERE keycloak_id = ? LIMIT 1",
        [keycloakId]
      );
      const existingUser = existingRows[0];

      let userId: number | null = null;

      if (existingUser) {
        userId = existingUser.id;
        cookieUsername = existingUser.username;

        // Update only email for existing user; do not overwrite username.
        if (email) {
          await pool.query("UPDATE users SET email = ? WHERE id = ?", [email, userId]);
        }
      } else {
        const usernameToInsert = usernameOrEmail || email;
        if (usernameToInsert) {
          const [insertResult] = await pool.query<ResultSetHeader>(
            `INSERT INTO users (keycloak_id, username, email, created_at)
             VALUES (?, ?, ?, NOW())`,
            [keycloakId, usernameToInsert, email || usernameToInsert]
          );

          userId = insertResult.insertId;
          cookieUsername = usernameToInsert;
        }
      }

      if (userId && keycloakRoles.length > 0) {
        // Step 3: Load all roles from DB to match by name
        const [dbRoles] = await pool.query<DbRoleRow[]>(
          "SELECT role_id, role_name FROM roles"
        );
        const roleMap = new Map(
          dbRoles.map((r) => [r.role_name.toLowerCase(), r.role_id])
        );

        // Step 4: Match Keycloak role names → DB role IDs
        const matchedRoleIds: number[] = [];
        for (const kr of keycloakRoles) {
          const rid = roleMap.get(kr.toLowerCase());
          if (rid) matchedRoleIds.push(rid);
        }

        console.log("Matched DB role IDs:", matchedRoleIds);

        if (matchedRoleIds.length > 0) {
          // Step 5: Full sync — delete old roles, insert current ones
          await pool.query("DELETE FROM user_roles WHERE user_id = ?", [userId]);

          const values = matchedRoleIds.map((rid) => [userId, rid, new Date()]);
          await pool.query(
            "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ?",
            [values]
          );

          console.log(`Synced ${matchedRoleIds.length} roles for user ${cookieUsername || usernameOrEmail || keycloakId} (DB id: ${userId})`);
        } else {
          console.warn("No matching roles found in DB for:", keycloakRoles);
        }
      }

      if (!cookieUsername && userId) {
        const [rows] = await pool.query<UsernameRow[]>("SELECT username FROM users WHERE id = ?", [userId]);
        cookieUsername = rows[0]?.username || null;
      }
    } catch (dbErr) {
      // Don't block login if DB sync fails — just log it
      console.error("DB sync error (login continues):", dbErr);
    }
  }

  // ─── Set cookies ───
  const headers = new Headers();
  headers.set("Location", "/webpage");

  headers.append(
    "Set-Cookie",
    `access_token=${tokenData.access_token}; HttpOnly; Path=/; SameSite=Lax`
  );

  if (cookieUsername) {
    headers.append(
      "Set-Cookie",
      `user=${encodeURIComponent(cookieUsername)}; Path=/; SameSite=Lax`
    );
  }

  if (keycloakId) {
    headers.append(
      "Set-Cookie",
      `keycloak_id=${encodeURIComponent(keycloakId)}; HttpOnly; Path=/; SameSite=Lax`
    );
  }

  return new Response(null, { status: 302, headers });
}
