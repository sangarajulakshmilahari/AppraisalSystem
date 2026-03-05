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

  // Optional: Decode token to get username/email (no DB check)
  let usernameOrEmail: string | null = null;
  try {
    const parts = (tokenData.access_token || "").split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf8")
      );
      usernameOrEmail =
        payload.preferred_username || payload.email || null;
    }
  } catch (err) {
    console.error("Failed to decode token payload", err);
  }

  // Set token cookie
  const cookies = [
    `access_token=${tokenData.access_token}; HttpOnly; Path=/; SameSite=Lax`,
  ];

  // Optional user cookie for UI
  if (usernameOrEmail) {
    cookies.push(
      `user=${encodeURIComponent(usernameOrEmail)}; Path=/; SameSite=Lax`
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": cookies.join("; "),
      Location: "/webpage",
    },
  });
}