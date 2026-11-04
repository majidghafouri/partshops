import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "partshop_session";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*", "/account/:path*", "/admin/:path*", "/request/:path*", "/notifications"],
};
