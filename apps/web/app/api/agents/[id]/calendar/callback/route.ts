import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// GET /api/agents/:id/calendar/callback - OAuth2 callback for Google Calendar
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const redirectTarget = `${appUrl}/agents/${id}`;

    if (error) {
      return NextResponse.redirect(
        `${redirectTarget}?calendar=error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${redirectTarget}?calendar=error&message=${encodeURIComponent("Missing authorization code")}`
      );
    }

    // Verify the agent belongs to this org
    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.redirect(
        `${redirectTarget}?calendar=error&message=${encodeURIComponent("Agent not found")}`
      );
    }

    // Exchange the authorization code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${redirectTarget}?calendar=error&message=${encodeURIComponent("Google OAuth is not configured")}`
      );
    }

    const redirectUri = `${appUrl}/api/agents/${id}/calendar/callback`;

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("Google token exchange error:", errorBody);
      return NextResponse.redirect(
        `${redirectTarget}?calendar=error&message=${encodeURIComponent("Failed to exchange authorization code")}`
      );
    }

    const tokens = await tokenResponse.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Fetch the user's primary calendar ID
    let calendarId = "primary";
    try {
      const calendarResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        calendarId = calendarData.id ?? "primary";
      }
    } catch {
      // Fall back to "primary" if we can't fetch calendar info
    }

    // Save tokens to the agent record
    await db.agent.updateMany({
      where: { id, orgId },
      data: {
        calendarId,
        calendarAccessToken: tokens.access_token,
        calendarRefreshToken: tokens.refresh_token ?? null,
        calendarTokenExpiry: expiresAt,
      },
    });

    return NextResponse.redirect(
      `${redirectTarget}?calendar=connected`
    );
  } catch (error) {
    console.error("Calendar OAuth callback error:", error);

    // For auth errors, return JSON since we can't reliably redirect
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: getErrorStatus(error) }
      );
    }

    // For other errors, try to redirect with error message
    const { id } = await params;
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.redirect(
      `${appUrl}/agents/${id}?calendar=error&message=${encodeURIComponent("An unexpected error occurred")}`
    );
  }
}
