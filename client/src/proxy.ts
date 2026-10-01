import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    // Check if expired (with a 5 second clock skew safety margin)
    return Date.now() >= payload.exp * 1000 - 5000;
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Retrieve token from HttpOnly cookie
  const rawToken =
    request.cookies.get("user_token")?.value ||
    request.cookies.get("token")?.value;

  const isLogoutForced = searchParams.get("logout") === "true";
  const tokenValid = Boolean(rawToken && !isTokenExpired(rawToken) && !isLogoutForced);

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtectedRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  // 1. Agar unauthenticated ya expired user protected route par jaye -> /login pe redirect and clear cookie
  if (isProtectedRoute && !tokenValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (rawToken) {
      response.cookies.delete("user_token");
      response.cookies.delete("token");
    }
    return response;
  }

  // 2. Agar valid logged-in user /login ya /signup khole -> /dashboard pe redirect
  // (Lekin agar logout=true ho ya token expired ho, toh redirect mat karo)
  if (isAuthRoute && tokenValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Agar auth route par expired token ho, toh stale cookie ko response se clear kardo
  if (isAuthRoute && rawToken && !tokenValid) {
    const response = NextResponse.next();
    response.cookies.delete("user_token");
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};
