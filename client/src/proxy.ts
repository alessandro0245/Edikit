import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token from HttpOnly cookie
  const token =
    request.cookies.get("user_token")?.value ||
    request.cookies.get("token")?.value;

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtectedRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  // 1. Agar unauthenticated user protected route par jaye -> /login pe redirect
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Agar logged-in user /login ya /signup khole -> /dashboard pe redirect
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
