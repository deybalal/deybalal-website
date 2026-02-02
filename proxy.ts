// middleware.ts (Next.js requires this filename and function name)
import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders } from "./lib/security-headers";

/**
 * Middleware that:
 *   1️⃣ Protects the /panel route (and its children) with session validation
 *   2️⃣ Injects security headers on every response
 */
export async function proxy(request: NextRequest) {
  // -------------------------------------------------------------------------
  // 1️⃣ Authentication for the "/panel" area
  // -------------------------------------------------------------------------
  const pathname = request.nextUrl.pathname;

  // Only enforce the session check on /panel and everything under it
  if (pathname.startsWith("/panel")) {
    // Check for Better Auth session cookie
    // Better Auth uses a cookie with prefix "dey" (as configured in lib/auth.ts)
    const sessionCookie = request.cookies.get("dey.session_token");

    if (!sessionCookie?.value) {
      // No valid session → redirect to login page
      const loginUrl = new URL("/login", request.url);
      // Add redirect parameter to return user to intended page after login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Optional: You could validate the session token here by calling Better Auth API
    // For now, we trust that the cookie exists and Better Auth will validate it
  }

  // -------------------------------------------------------------------------
  // 2️⃣ Build the response (the request is allowed to continue)
  // -------------------------------------------------------------------------
  const response = NextResponse.next();

  // -------------------------------------------------------------------------
  // 3️⃣ Apply the security headers to the response
  // -------------------------------------------------------------------------
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Matcher:
 *   • All routes **except** the internal Next.js assets
 *   • The auth check for `/panel` is performed inside the function
 */
export const config = {
  matcher: [
    // Match everything but Next.js internal static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
