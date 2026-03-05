import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (request.nextUrl.pathname.startsWith("/webpage") && !token) {
    return NextResponse.redirect(new URL("/api/auth/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/webpage/:path*"] };