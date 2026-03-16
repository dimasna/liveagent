import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

// GET /api/workspace/calendar — Check if workspace has Google Calendar connected
export async function GET() {
  try {
    const { orgId } = await getAuthUser();

    const sub = await db.subscription.findUnique({
      where: { orgId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        googleEmail: true,
      },
    });

    return NextResponse.json({
      connected: !!sub?.googleAccessToken,
      email: sub?.googleEmail ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// DELETE /api/workspace/calendar — Disconnect workspace Google Calendar
export async function DELETE() {
  try {
    const { orgId } = await getAuthUser();

    await db.subscription.update({
      where: { orgId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleEmail: null,
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
