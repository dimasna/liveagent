"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { CalendarConnect } from "@modules/agents/components/calendar-connect";
import { Loader2Icon, PlugIcon } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  calendarId: string | null;
}

export default function AgentIntegrationsPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agents/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAgent(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect external services to your voice agent
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-screen-md space-y-6">
          {/* Google Calendar */}
          {agent && (
            <Suspense
              fallback={
                <div className="rounded-xl border border-border p-6">
                  Loading calendar...
                </div>
              }
            >
              <CalendarConnect
                agentId={id}
                calendarId={agent.calendarId}
                onUpdate={(cid) => setAgent({ ...agent, calendarId: cid })}
              />
            </Suspense>
          )}

          {/* Future integrations placeholder */}
          <div className="rounded-xl border border-dashed border-border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <PlugIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  More Integrations Coming Soon
                </p>
                <p className="text-xs text-muted-foreground">
                  Twilio phone numbers, Zapier, webhooks, and more
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
