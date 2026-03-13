import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/agents/:id/calendar/calendars — List user's Google Calendars
// So they can pick which one the agent should use
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: {
        id: true,
        calendarAccessToken: true,
        calendarId: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (!agent.calendarAccessToken) {
      return NextResponse.json(
        { error: "Calendar not connected" },
        { status: 400 }
      );
    }

    // Fetch all calendars from Google Calendar API
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${agent.calendarAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Google Calendar API error:", err);
      return NextResponse.json(
        { error: "Failed to fetch calendars. Token may be expired." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const calendars = (data.items ?? []).map(
      (cal: {
        id: string;
        summary: string;
        primary?: boolean;
        backgroundColor?: string;
        accessRole?: string;
      }) => ({
        id: cal.id,
        name: cal.summary,
        primary: cal.primary ?? false,
        color: cal.backgroundColor,
        accessRole: cal.accessRole,
      })
    );

    return NextResponse.json({
      calendars,
      selectedCalendarId: agent.calendarId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// PUT /api/agents/:id/calendar/calendars — Select which calendar to use
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;
    const { calendarId } = await req.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: "calendarId is required" },
        { status: 400 }
      );
    }

    const result = await db.agent.updateMany({
      where: { id, orgId },
      data: { calendarId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, calendarId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
