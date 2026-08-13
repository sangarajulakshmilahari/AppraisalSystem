// app/api/auth/callback/route.ts
import { keycloak } from "../../lib/keycloak";
import { getPool } from "../../lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

type ExistingUserRow = RowDataPacket & {
  id: number;
  username: string;
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

      console.log("=== KEYCLOAK LOGIN ===");
      console.log("User:", usernameOrEmail);
      console.log("Keycloak ID:", keycloakId);
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
