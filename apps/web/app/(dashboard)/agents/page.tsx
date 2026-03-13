"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  businessName: string;
  businessType: string;
  status: string;
  phoneNumber: string | null;
  calendarId: string | null;
  createdAt: string;
  _count: { conversations: number; callLogs: number };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createAgent() {
    setCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Agent" }),
      });
      if (res.ok) {
        const agent = await res.json();
        setAgents((prev) => [agent, ...prev]);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voice Agents</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your AI booking agents
          </p>
        </div>
        <button
          onClick={createAgent}
          disabled={creating}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Agent"}
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h3 className="mb-1 font-semibold">No agents yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first voice agent to start handling reservations
          </p>
          <button
            onClick={createAgent}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
          >
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="group rounded-xl border border-border p-6 transition-colors hover:border-brand/50 hover:bg-accent/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold group-hover:text-brand">
                  {agent.name}
                </h3>
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
                {(agent.businessType ?? "").replace("_", " ")}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{agent._count?.callLogs ?? 0} calls</span>
                <span>{agent._count?.conversations ?? 0} conversations</span>
                <span
                  className={
                    agent.calendarId
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }
                >
                  {agent.calendarId ? "Calendar connected" : "No calendar"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
