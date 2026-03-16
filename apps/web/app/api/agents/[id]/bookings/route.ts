import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function getValidAccessToken(agent: {
  id: string;
  calendarAccessToken: string | null;
  calendarRefreshToken: string | null;
  calendarTokenExpiry: Date | null;
}): Promise<string> {
  if (
    agent.calendarAccessToken &&
    agent.calendarTokenExpiry &&
    new Date(agent.calendarTokenExpiry) > new Date()
  ) {
    return agent.calendarAccessToken;
  }

  if (!agent.calendarRefreshToken) {
    throw new Error("No refresh token available");
  }

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
      refresh_token: agent.calendarRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh access token");
  }

  const tokens = await res.json();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await db.agent.update({
    where: { id: agent.id },
    data: {
      calendarAccessToken: tokens.access_token,
      ...(tokens.refresh_token && {
        calendarRefreshToken: tokens.refresh_token,
      }),
      ...(expiresAt && { calendarTokenExpiry: expiresAt }),
    },
  });

  return tokens.access_token;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string; displayName?: string }[];
  extendedProperties?: {
    private?: Record<string, string>;
  };
  status?: string;
}

// GET /api/agents/:id/bookings — Fetch bookings from Google Calendar with resource mapping
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to query params are required" },
        { status: 400 }
      );
    }

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: {
        id: true,
        calendarId: true,
        calendarAccessToken: true,
        calendarRefreshToken: true,
        calendarTokenExpiry: true,
        timezone: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (!agent.calendarId || !agent.calendarAccessToken) {
      // No calendar connected — return empty with resources
      const resources = await db.resource.findMany({
        where: { agentId: id, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ bookings: [], resources });
    }

    const accessToken = await getValidAccessToken(agent);

    // Fetch resources
    const resources = await db.resource.findMany({
      where: { agentId: id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });

    // Fetch events from Google Calendar
    const calendarId = encodeURIComponent(agent.calendarId);
    const eventsUrl = new URL(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`
    );
    eventsUrl.searchParams.set("timeMin", from);
    eventsUrl.searchParams.set("timeMax", to);
    eventsUrl.searchParams.set("singleEvents", "true");
    eventsUrl.searchParams.set("orderBy", "startTime");
    eventsUrl.searchParams.set("timeZone", agent.timezone || "America/New_York");

    const eventsRes = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsRes.ok) {
      const err = await eventsRes.text();
      console.error("Google Calendar events error:", err);
      return NextResponse.json(
        { error: "Failed to fetch bookings from Google Calendar" },
        { status: 502 }
      );
    }

    const eventsData = await eventsRes.json();
    const events: GoogleCalendarEvent[] = eventsData.items ?? [];

    // Build resource lookup
    const resourceMap = new Map(resources.map((r) => [r.id, r]));

    // Map events to bookings with resource info
    const bookings = events
      .filter((e) => e.status !== "cancelled")
      .map((e) => {
        const resourceId =
          e.extendedProperties?.private?.resourceId ?? null;
        const resource = resourceId ? resourceMap.get(resourceId) : null;

        // Try to extract caller info from summary: "Table 5 - Smith Party"
        const summaryParts = e.summary?.split(" - ") ?? [];
        const callerName =
          summaryParts.length > 1
            ? summaryParts.slice(1).join(" - ")
            : e.summary || null;

        return {
          id: e.id,
          title: e.summary || "Booking",
          callerName,
          callerPhone:
            e.extendedProperties?.private?.callerPhone ?? null,
          start: e.start?.dateTime || e.start?.date || "",
          end: e.end?.dateTime || e.end?.date || "",
          status: e.status || "confirmed",
          resourceId: resource?.id ?? null,
          resourceName: resource?.name ?? e.extendedProperties?.private?.resourceName ?? null,
          resourceType: resource?.type ?? null,
          description: e.description || null,
          attendees:
            e.attendees?.map((a) => ({
              email: a.email,
              name: a.displayName,
            })) ?? [],
        };
      });

    return NextResponse.json({ bookings, resources });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
