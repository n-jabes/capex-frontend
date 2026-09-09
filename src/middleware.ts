import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_PATHS = ["/", "/login", "/register"];

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/capex-tree") ||
    pathname.startsWith("/settings")
  );
}

export function middleware(request: NextRequest) {
  // Local-only mode (no API URL): skip auth redirects.
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("capex_auth")?.value);

  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/capex-tree", request.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
