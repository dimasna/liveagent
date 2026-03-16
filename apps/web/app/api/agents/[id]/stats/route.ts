import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/agents/:id/stats - Get agent analytics from Conversation data
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    const agent = await db.agent.findFirst({ where: { id, orgId } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCalls,
      completedCalls,
      totalBookings,
      recentCalls,
      callsThisWeek,
      statusBreakdown,
      conversations,
    ] = await Promise.all([
      db.conversation.count({ where: { agentId: id } }),
      db.conversation.count({ where: { agentId: id, status: "COMPLETED" } }),
      db.conversation.count({ where: { agentId: id, bookingMade: true } }),
      db.conversation.count({
        where: { agentId: id, startedAt: { gte: thirtyDaysAgo } },
      }),
      db.conversation.count({
        where: { agentId: id, startedAt: { gte: sevenDaysAgo } },
      }),
      db.conversation.groupBy({
        by: ["status"],
        where: { agentId: id, startedAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      // Fetch completed conversations with timestamps to compute duration
      db.conversation.findMany({
        where: { agentId: id, status: "COMPLETED", endedAt: { not: null } },
        select: { startedAt: true, endedAt: true },
      }),
    ]);

    // Compute total minutes from conversation start/end timestamps
    let totalSeconds = 0;
    for (const c of conversations) {
      if (c.endedAt) {
        totalSeconds += Math.round(
          (c.endedAt.getTime() - c.startedAt.getTime()) / 1000
        );
      }
    }
    const totalMinutes = Math.round(totalSeconds / 60);

    // Average call duration
    const avgDurationSecs =
      conversations.length > 0
        ? Math.round(totalSeconds / conversations.length)
        : 0;

    // Daily call counts for the last 7 days
    const dailyCalls: { date: string; calls: number; bookings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [dayCalls, dayBookings] = await Promise.all([
        db.conversation.count({
          where: { agentId: id, startedAt: { gte: dayStart, lt: dayEnd } },
        }),
        db.conversation.count({
          where: {
            agentId: id,
            bookingMade: true,
            startedAt: { gte: dayStart, lt: dayEnd },
          },
        }),
      ]);

      dailyCalls.push({
        date: dayStart.toISOString().split("T")[0],
        calls: dayCalls,
        bookings: dayBookings,
      });
    }

    // Recent conversations for the activity list
    const recentConversations = await db.conversation.findMany({
      where: { agentId: id },
      orderBy: { startedAt: "desc" },
      take: 10,
      select: {
        id: true,
        callerPhone: true,
        callerName: true,
        status: true,
        bookingMade: true,
        startedAt: true,
        endedAt: true,
        summary: true,
      },
    });

    return NextResponse.json({
      totalCalls,
      completedCalls,
      totalBookings,
      recentCalls,
      callsThisWeek,
      totalMinutes,
      avgDurationSecs,
      bookingRate:
        totalCalls > 0
          ? Math.round((totalBookings / totalCalls) * 100)
          : 0,
      completionRate:
        totalCalls > 0
          ? Math.round((completedCalls / totalCalls) * 100)
          : 0,
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      dailyCalls,
      recentConversations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
