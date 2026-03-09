// app/api/auth/callback/route.ts
import { keycloak } from "../../lib/keycloak";

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

  // Decode token to get username/email AND keycloak_id (sub)
  let usernameOrEmail: string | null = null;
  let keycloakId: string | null = null;
  try {
    const parts = (tokenData.access_token || "").split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf8")
      );
      usernameOrEmail =
        payload.preferred_username || payload.email || null;
      keycloakId = payload.sub || null;
    }
  } catch (err) {
    console.error("Failed to decode token payload", err);
  }

  // Build cookie headers
  const headers = new Headers();
  headers.set("Location", "/webpage");

  // Set token cookie (HttpOnly)
  headers.append(
    "Set-Cookie",
    `access_token=${tokenData.access_token}; HttpOnly; Path=/; SameSite=Lax`
  );

  // User display name cookie (readable by client JS)
  if (usernameOrEmail) {
    headers.append(
      "Set-Cookie",
      `user=${encodeURIComponent(usernameOrEmail)}; Path=/; SameSite=Lax`
    );
  }

  // Keycloak ID cookie (for DB user lookup)
  if (keycloakId) {
    headers.append(
      "Set-Cookie",
      `keycloak_id=${encodeURIComponent(keycloakId)}; HttpOnly; Path=/; SameSite=Lax`
    );
  }

  return new Response(null, {
    status: 302,
    headers,
  });
}