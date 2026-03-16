import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@lib/session";

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;

  // Auth pages and API
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return true;
  if (pathname.startsWith("/api/auth/")) return true;

  // Marketing pages
  if (pathname === "/privacy" || pathname === "/terms" || pathname === "/about") return true;
  if (pathname.startsWith("/privacy/") || pathname.startsWith("/terms/") || pathname.startsWith("/about/")) return true;

  // Widget config is public
  if (/^\/api\/agents\/[^/]+\/widget-config$/.test(pathname)) return true;

  return false;
}

export default async function middleware(req: NextRequest) {
  if (isPublicRoute(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    // For API routes, return 401 instead of redirecting
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
