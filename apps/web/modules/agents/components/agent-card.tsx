"use client";

import Link from "next/link";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    businessName: string;
    businessType: string;
    status: string;
    calendarId: string | null;
    _count: { conversations: number; callLogs: number };
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group rounded-xl border border-border p-6 transition-colors hover:border-brand/50 hover:bg-accent/50"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold group-hover:text-brand">{agent.name}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            agent.status === "ACTIVE"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
          }`}
        >
          {agent.status}
        </span>
      </div>
      {agent.businessName && (
        <p className="mb-1 text-sm text-muted-foreground">
          {agent.businessName}
        </p>
      )}
      <p className="mb-4 text-xs capitalize text-muted-foreground">
        {agent.businessType.replace("_", " ")}
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{agent._count.callLogs} calls</span>
        <span>{agent._count.conversations} conversations</span>
        <span
          className={
            agent.calendarId ? "text-green-600" : "text-muted-foreground"
          }
        >
          {agent.calendarId ? "Calendar connected" : "No calendar"}
        </span>
      </div>
    </Link>
  );
}
