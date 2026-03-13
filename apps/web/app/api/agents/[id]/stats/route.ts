import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/agents/:id/stats - Get agent analytics
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

    const [totalCalls, totalBookings, recentCalls, outcomeBreakdown] =
      await Promise.all([
        db.callLog.count({ where: { agentId: id } }),
        db.callLog.count({
          where: { agentId: id, bookingMade: true },
        }),
        db.callLog.count({
          where: { agentId: id, startedAt: { gte: thirtyDaysAgo } },
        }),
        db.callLog.groupBy({
          by: ["outcome"],
          where: { agentId: id, startedAt: { gte: thirtyDaysAgo } },
          _count: true,
        }),
      ]);

    const totalMinutes = await db.callLog.aggregate({
      where: { agentId: id },
      _sum: { durationSecs: true },
    });

    return NextResponse.json({
      totalCalls,
      totalBookings,
      recentCalls,
      totalMinutes: Math.round(
        (totalMinutes._sum.durationSecs || 0) / 60
      ),
      bookingRate:
        totalCalls > 0
          ? Math.round((totalBookings / totalCalls) * 100)
          : 0,
      outcomeBreakdown: outcomeBreakdown.map((o) => ({
        outcome: o.outcome,
        count: o._count,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
