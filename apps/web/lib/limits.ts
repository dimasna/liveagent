import { db } from "@liveagent/db";
import { PLANS } from "@liveagent/shared";

export class LimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitError";
  }
}

export async function checkAgentLimit(orgId: string) {
  const subscription = await db.subscription.findUnique({
    where: { orgId },
  });

  const plan = subscription?.plan || "FREE";
  const planConfig = PLANS[plan as keyof typeof PLANS];
  const maxAgents = subscription?.maxAgents ?? planConfig.maxAgents;

  if (maxAgents === -1) return; // unlimited

  const agentCount = await db.agent.count({ where: { orgId } });

  if (agentCount >= maxAgents) {
    throw new LimitError(
      `Agent limit reached (${agentCount}/${maxAgents}). Upgrade your plan to create more agents.`
    );
  }
}

export async function getUsage(orgId: string) {
  const subscription = await db.subscription.findUnique({
    where: { orgId },
  });

  const plan = subscription?.plan || "FREE";
  const planConfig = PLANS[plan as keyof typeof PLANS];

  const [agentCount, totalSeconds] = await Promise.all([
    db.agent.count({ where: { orgId } }),
    db.callLog.aggregate({
      where: { agent: { orgId } },
      _sum: { durationSecs: true },
    }),
  ]);

  return {
    plan,
    agentCount,
    maxAgents: subscription?.maxAgents ?? planConfig.maxAgents,
    minutesUsed: Math.round((totalSeconds._sum.durationSecs || 0) / 60),
    maxMinutes: subscription?.maxMinutesMonth ?? planConfig.maxMinutesMonth,
  };
}
