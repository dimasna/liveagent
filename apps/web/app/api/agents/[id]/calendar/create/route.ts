import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";
import { getCalendarTemplate, resolveTemplate } from "@liveagent/shared";

type Params = { params: Promise<{ id: string }> };

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function getValidWorkspaceToken(orgId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiry: Date | null;
}> {
  const sub = await db.subscription.findUnique({
    where: { orgId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!sub?.googleAccessToken || !sub?.googleRefreshToken) {
    throw new Error("Google Calendar not connected at workspace level");
  }

  // Check if token is still valid
  if (sub.googleTokenExpiry && new Date(sub.googleTokenExpiry) > new Date()) {
    return {
      accessToken: sub.googleAccessToken,
      refreshToken: sub.googleRefreshToken,
      expiry: sub.googleTokenExpiry,
    };
  }

  // Refresh the token
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth not configured");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: sub.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh workspace access token");
  }

  const tokens = await res.json();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  // Persist refreshed tokens to subscription
  await db.subscription.update({
    where: { orgId },
    data: {
      googleAccessToken: tokens.access_token,
      ...(tokens.refresh_token && {
        googleRefreshToken: tokens.refresh_token,
      }),
      ...(expiresAt && { googleTokenExpiry: expiresAt }),
    },
  });

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || sub.googleRefreshToken,
    expiry: expiresAt,
  };
}

// POST /api/agents/:id/calendar/create — Create a Google Calendar from template
// Uses workspace-level Google tokens, copies them to the agent
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    const { template, businessName, timezone } = body as {
      template: string;
      businessName: string;
      timezone: string;
    };

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Get workspace-level tokens
    const { accessToken, refreshToken, expiry } =
      await getValidWorkspaceToken(orgId);

    const calTemplate = getCalendarTemplate(template || "other");
    const vars = { businessName: businessName || "My Business" };

    // 1. Create the calendar
    const createRes = await fetch(`${GOOGLE_CALENDAR_API}/calendars`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: resolveTemplate(calTemplate.summaryTemplate, vars),
        description: resolveTemplate(calTemplate.descriptionTemplate, vars),
        timeZone: timezone || "America/New_York",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Google Calendar create error:", err);
      return NextResponse.json(
        { error: "Failed to create Google Calendar" },
        { status: 502 }
      );
    }

    const newCalendar = await createRes.json();

    // 2. Set calendar color (best-effort)
    try {
      await fetch(
        `${GOOGLE_CALENDAR_API}/users/me/calendarList/${encodeURIComponent(newCalendar.id)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ colorId: calTemplate.colorId }),
        }
      );
    } catch {
      // Color setting is non-critical
    }

    // 3. Update agent: set calendar ID + copy workspace tokens so voice agent can use them
    await db.agent.updateMany({
      where: { id, orgId },
      data: {
        calendarId: newCalendar.id,
        calendarAccessToken: accessToken,
        calendarRefreshToken: refreshToken,
        calendarTokenExpiry: expiry,
      },
    });

    return NextResponse.json({
      success: true,
      calendarId: newCalendar.id,
      calendarName: newCalendar.summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
