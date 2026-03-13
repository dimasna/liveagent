import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

// POST /api/agents/:id/calendar - Connect Google Calendar via OAuth
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;
    const { calendarId, accessToken, refreshToken, expiresAt } =
      await req.json();

    const result = await db.agent.updateMany({
      where: { id, orgId },
      data: {
        calendarId,
        calendarAccessToken: accessToken,
        calendarRefreshToken: refreshToken,
        calendarTokenExpiry: expiresAt ? new Date(expiresAt) : null,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// DELETE /api/agents/:id/calendar - Disconnect calendar
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    await db.agent.updateMany({
      where: { id, orgId },
      data: {
        calendarId: null,
        calendarAccessToken: null,
        calendarRefreshToken: null,
        calendarTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
