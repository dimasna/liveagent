"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { BUSINESS_TYPES, GEMINI_VOICES, DEFAULT_OPERATING_HOURS } from "@liveagent/shared";
import { CalendarConnect } from "@modules/agents/components/calendar-connect";

interface Agent {
  id: string;
  name: string;
  businessName: string;
  businessType: string;
  timezone: string;
  instruction: string;
  greeting: string;
  voice: string;
  model: string;
  language: string;
  phoneNumber: string | null;
  calendarId: string | null;
  operatingHours: Record<string, { open: string; close: string } | null> | null;
  bookingDuration: number;
  maxAdvanceDays: number;
  status: string;
}

interface Stats {
  totalCalls: number;
  totalBookings: number;
  recentCalls: number;
  totalMinutes: number;
  bookingRate: number;
  outcomeBreakdown: { outcome: string; count: number }[];
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"settings" | "analytics" | "test">("settings");

  useEffect(() => {
    fetch(`/api/agents/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAgent(data); });
    fetch(`/api/agents/${id}/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); });
  }, [id]);

  async function save() {
    if (!agent) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
      if (res.ok) {
        const updated = await res.json();
        setAgent(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteAgent() {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      router.push("/agents");
    } catch {
      // silently fail
    }
  }

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">
            Configure your voice agent
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={deleteAgent}
            className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Delete
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted p-1">
        {(["settings", "analytics", "test"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "test" ? "Test Call" : t}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <div className="rounded-xl border border-border p-6">
            <h2 className="mb-4 font-semibold">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Agent Name
                </label>
                <input
                  value={agent.name}
                  onChange={(e) =>
                    setAgent({ ...agent, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Business Name
                </label>
                <input
                  value={agent.businessName}
                  onChange={(e) =>
                    setAgent({ ...agent, businessName: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Business Type
                </label>
                <select
                  value={agent.businessType}
                  onChange={(e) =>
                    setAgent({ ...agent, businessType: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Timezone
                </label>
                <input
                  value={agent.timezone}
                  onChange={(e) =>
                    setAgent({ ...agent, timezone: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="rounded-xl border border-border p-6">
            <h2 className="mb-4 font-semibold">Voice Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Voice</label>
                <select
                  value={agent.voice}
                  onChange={(e) =>
                    setAgent({ ...agent, voice: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Greeting Message
                </label>
                <textarea
                  value={agent.greeting}
                  onChange={(e) =>
                    setAgent({ ...agent, greeting: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Custom Instructions
                </label>
                <textarea
                  value={agent.instruction}
                  onChange={(e) =>
                    setAgent({ ...agent, instruction: e.target.value })
                  }
                  rows={4}
                  placeholder="Additional instructions for the agent..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Booking Settings */}
          <div className="rounded-xl border border-border p-6">
            <h2 className="mb-4 font-semibold">Booking Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Default Slot Duration (minutes)
                </label>
                <input
                  type="number"
                  value={agent.bookingDuration}
                  onChange={(e) =>
                    setAgent({
                      ...agent,
                      bookingDuration: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Max Advance Booking (days)
                </label>
                <input
                  type="number"
                  value={agent.maxAdvanceDays}
                  onChange={(e) =>
                    setAgent({
                      ...agent,
                      maxAdvanceDays: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Calendar Integration */}
          <Suspense fallback={<div className="rounded-xl border border-border p-6">Loading calendar...</div>}>
            <CalendarConnect
              agentId={id}
              calendarId={agent.calendarId}
              onUpdate={(cid) => setAgent({ ...agent, calendarId: cid })}
            />
          </Suspense>
        </div>
      )}

      {tab === "analytics" && stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Calls</p>
            <p className="text-3xl font-bold">{stats.totalCalls}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Bookings Made</p>
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Booking Rate</p>
            <p className="text-3xl font-bold">{stats.bookingRate}%</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Minutes</p>
            <p className="text-3xl font-bold">{stats.totalMinutes}</p>
          </div>

          {/* Outcome breakdown */}
          <div className="col-span-full rounded-xl border border-border p-6">
            <h3 className="mb-4 font-semibold">Call Outcomes (Last 30 Days)</h3>
            {(stats.outcomeBreakdown?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No call data yet</p>
            ) : (
              <div className="space-y-2">
                {(stats.outcomeBreakdown ?? []).map((o) => (
                  <div
                    key={o.outcome}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize">
                      {o.outcome.replace("_", " ").toLowerCase()}
                    </span>
                    <span className="text-sm font-medium">{o.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "test" && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-border p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <svg
                className="h-8 w-8 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Test Your Agent</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Start a test voice call to hear how your agent handles
              reservations. Uses your microphone for real-time conversation.
            </p>
            <a
              href={`/playground/${id}`}
              className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Start Test Call
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
