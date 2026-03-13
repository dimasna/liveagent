import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser } from "@lib/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// GET /api/calendar/callback — Fixed OAuth2 callback for Google Calendar
// The agent ID is passed via the `state` query parameter.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const agentId = url.searchParams.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // If no agent ID in state, we can't redirect properly
  if (!agentId) {
    return NextResponse.redirect(
      `${appUrl}/agents?calendar=error&message=${encodeURIComponent("Missing agent reference")}`
    );
  }

  const redirectTarget = `${appUrl}/agents/${agentId}`;

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

  try {
    const { orgId } = await getAuthUser();

    // Verify the agent belongs to this org
    const agent = await db.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.redirect(
        `${redirectTarget}?calendar=error&message=${encodeURIComponent("Agent not found")}`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${redirectTarget}?calendar=error&message=${encodeURIComponent("Google OAuth is not configured")}`
      );
    }

    // Must match the redirect_uri used in the authorization request
    const redirectUri = `${appUrl}/api/calendar/callback`;

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
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        calendarId = calendarData.id ?? "primary";
      }
    } catch {
      // Fall back to "primary"
    }

    // Save tokens to the agent record
    await db.agent.updateMany({
      where: { id: agentId, orgId },
      data: {
        calendarId,
        calendarAccessToken: tokens.access_token,
        calendarRefreshToken: tokens.refresh_token ?? null,
        calendarTokenExpiry: expiresAt,
      },
    });

    return NextResponse.redirect(`${redirectTarget}?calendar=connected`);
  } catch (error) {
    console.error("Calendar OAuth callback error:", error);
    return NextResponse.redirect(
      `${redirectTarget}?calendar=error&message=${encodeURIComponent("An unexpected error occurred")}`
    );
  }
}
