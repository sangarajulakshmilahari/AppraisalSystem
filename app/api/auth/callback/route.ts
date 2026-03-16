// app/api/auth/callback/route.ts
import { keycloak } from "../../lib/keycloak";
import { getPool } from "../../lib/db";

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
  if (keycloakId && usernameOrEmail) {
    try {
      const pool = getPool();

      // Step 1: Upsert user into users table
      //   - New user → INSERT
      //   - Existing user → UPDATE username & email
      await pool.query(
        `INSERT INTO users (keycloak_id, username, email, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           username = VALUES(username),
           email = VALUES(email)`,
        [keycloakId, usernameOrEmail, email || usernameOrEmail]
      );

      // Step 2: Get the user's DB id
      const [userRows] = await pool.query(
        "SELECT id FROM users WHERE keycloak_id = ?",
        [keycloakId]
      );
      const userId = (userRows as any[])[0]?.id;

      if (userId && keycloakRoles.length > 0) {
        // Step 3: Load all roles from DB to match by name
        const [dbRoles] = await pool.query(
          "SELECT role_id, role_name FROM roles"
        );
        const roleMap = new Map(
          (dbRoles as any[]).map((r) => [r.role_name.toLowerCase(), r.role_id])
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

          console.log(`Synced ${matchedRoleIds.length} roles for user ${usernameOrEmail} (DB id: ${userId})`);
        } else {
          console.warn("No matching roles found in DB for:", keycloakRoles);
        }
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

  if (usernameOrEmail) {
    headers.append(
      "Set-Cookie",
      `user=${encodeURIComponent(usernameOrEmail)}; Path=/; SameSite=Lax`
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