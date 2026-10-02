import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    // Universal Web API base64 decode (works in Edge Runtime, Browser, and Node)
    if (typeof atob === "function") {
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return JSON.parse(new TextDecoder().decode(bytes));
    }

    // Node fallback
    if (typeof (globalThis as any).Buffer !== "undefined") {
      return JSON.parse((globalThis as any).Buffer.from(base64, "base64").toString("utf-8"));
    }

    return null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    // If we cannot decode exp or exp is missing, do NOT treat token as expired!
    if (!payload || typeof payload.exp !== "number") {
      return false;
    }
    // Check if expired (with 5 second clock-skew safety buffer)
    return Date.now() >= payload.exp * 1000 - 5000;
  } catch {
    // Fail-open: do not assume token is expired if any error happens during parsing
    return false;
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

  // 1. Agar unauthenticated ya expired user protected route par jaye -> /login pe redirect
  if (isProtectedRoute && !tokenValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (rawToken && (isLogoutForced || isTokenExpired(rawToken))) {
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

  // 3. Agar auth route par explicitly logout manga gaya ho, tabhi cookies delete karein
  if (isAuthRoute && rawToken && isLogoutForced) {
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
