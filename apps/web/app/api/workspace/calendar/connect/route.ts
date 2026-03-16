import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getErrorStatus } from "@lib/auth";

// GET /api/workspace/calendar/connect — Generate Google OAuth URL for workspace
export async function GET(req: NextRequest) {
  try {
    await getAuthUser();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID." },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "";
    const redirectUri = `${appUrl}/api/workspace/calendar/callback`;

    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const authUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", "workspace");

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
