import { NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

// GET /api/billing/usage - Get current usage stats for the org
export async function GET() {
  try {
    const { orgId } = await getAuthUser();

    // Get subscription (or defaults for free tier)
    const subscription = await db.subscription.findUnique({
      where: { orgId },
    });

    const plan = subscription?.plan ?? "FREE";
    const maxAgents = subscription?.maxAgents ?? 1;
    const maxMinutes = subscription?.maxMinutesMonth ?? 100;

    // Count active agents
    const agentCount = await db.agent.count({
      where: { orgId },
    });

    // Calculate minutes used this billing period (current calendar month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const agentIds = await db.agent.findMany({
      where: { orgId },
      select: { id: true },
    });

    const callLogs = await db.callLog.aggregate({
      where: {
        agentId: { in: agentIds.map((a) => a.id) },
        startedAt: { gte: startOfMonth },
      },
      _sum: {
        durationSecs: true,
      },
    });

    const totalSeconds = callLogs._sum.durationSecs ?? 0;
    const minutesUsed = Math.ceil(totalSeconds / 60);

    return NextResponse.json({
      plan,
      agentCount,
      maxAgents,
      minutesUsed,
      maxMinutes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
