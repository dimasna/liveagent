"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneIcon, PlusIcon, TrashIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CreateAgentModal } from "@modules/agents/components/create-agent-modal";

interface Agent {
  id: string;
  name: string;
  businessName: string | null;
  businessType: string | null;
  voice: string | null;
  status: string;
  calendarId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { conversations: number; callLogs: number };
}

export default function WorkspacePage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function deleteAgent(e: React.MouseEvent, agentId: string) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto w-full max-w-screen-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Agents</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:bg-foreground/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Voice Agent
          </button>
        </div>

        {/* Agent Cards Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <PhoneIcon className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-[15px] font-medium">No agents yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Create your first voice agent to start handling reservations
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:bg-foreground/90 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                New Voice Agent
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/10"
                  onClick={() => router.push(`/agents/${agent.id}`)}
                >
                  {/* Thumbnail preview */}
                  <div className="relative h-36 bg-gradient-to-br from-accent via-card to-accent p-5">
                    {/* Mini voice widget preview */}
                    <div className="absolute right-4 top-4 w-32 rounded-lg border border-border bg-background/80 p-2.5 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                          <PhoneIcon className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] font-medium text-foreground truncate">
                          {agent.name}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="w-0.5 rounded-full bg-foreground/20"
                            style={{ height: `${6 + Math.random() * 10}px` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Voice & Status badges */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                      {agent.voice && (
                        <span className="rounded-full bg-accent border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {agent.voice}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          agent.status === "ACTIVE"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {agent.status === "ACTIVE" ? "Active" : agent.status}
                      </span>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-t border-border">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">
                        {agent.name}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {agent.businessName
                          ? agent.businessName
                          : `Updated ${formatDistanceToNow(
                              new Date(agent.updatedAt || agent.createdAt),
                              { addSuffix: true }
                            )}`}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this agent?")) {
                          deleteAgent(e, agent.id);
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-destructive group-hover:opacity-100"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateAgentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={() => {
          fetch("/api/agents")
            .then((r) => r.json())
            .then((data) => {
              if (Array.isArray(data)) setAgents(data);
            });
        }}
      />
    </div>
  );
}
