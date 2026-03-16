"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2Icon,
  PhoneIcon,
  CheckCircleIcon,
  CalendarCheckIcon,
  ClockIcon,
  TrendingUpIcon,
  PercentIcon,
} from "lucide-react";

interface Stats {
  totalCalls: number;
  completedCalls: number;
  totalBookings: number;
  recentCalls: number;
  callsThisWeek: number;
  totalMinutes: number;
  avgDurationSecs: number;
  bookingRate: number;
  completionRate: number;
  statusBreakdown: { status: string; count: number }[];
  dailyCalls: { date: string; calls: number; bookings: number }[];
  recentConversations: {
    id: string;
    callerPhone: string | null;
    callerName: string | null;
    status: string;
    bookingMade: boolean;
    startedAt: string;
    endedAt: string | null;
    summary: string | null;
  }[];
}

export default function AgentAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${id}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = stats.totalCalls > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Call performance and booking metrics
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-screen-lg space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              icon={<PhoneIcon className="h-4 w-4" />}
              label="Total Calls"
              value={stats.totalCalls}
              sub={`${stats.callsThisWeek} this week`}
            />
            <StatCard
              icon={<CalendarCheckIcon className="h-4 w-4" />}
              label="Bookings Made"
              value={stats.totalBookings}
              sub={`${stats.bookingRate}% booking rate`}
            />
            <StatCard
              icon={<CheckCircleIcon className="h-4 w-4" />}
              label="Completed Calls"
              value={stats.completedCalls}
              sub={`${stats.completionRate}% completion rate`}
            />
            <StatCard
              icon={<ClockIcon className="h-4 w-4" />}
              label="Total Minutes"
              value={stats.totalMinutes}
              sub={`${formatDuration(stats.avgDurationSecs)} avg duration`}
            />
            <StatCard
              icon={<TrendingUpIcon className="h-4 w-4" />}
              label="Last 30 Days"
              value={stats.recentCalls}
              sub="calls"
            />
            <StatCard
              icon={<PercentIcon className="h-4 w-4" />}
              label="Booking Rate"
              value={`${stats.bookingRate}%`}
              sub={`${stats.totalBookings} of ${stats.totalCalls} calls`}
            />
          </div>

          {!hasData && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <PhoneIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No calls yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Analytics will appear here once your agent starts receiving calls.
              </p>
            </div>
          )}

          {hasData && (
            <>
              {/* Daily Activity Chart */}
              <div className="rounded-xl border border-border p-6">
                <h3 className="mb-4 text-sm font-semibold">Last 7 Days</h3>
                <div className="flex items-end gap-2" style={{ height: 120 }}>
                  {stats.dailyCalls.map((day) => {
                    const maxCalls = Math.max(
                      ...stats.dailyCalls.map((d) => d.calls),
                      1
                    );
                    const height = Math.max((day.calls / maxCalls) * 100, 4);
                    const bookingHeight =
                      day.calls > 0
                        ? Math.max((day.bookings / maxCalls) * 100, 0)
                        : 0;
                    const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "short" }
                    );

                    return (
                      <div
                        key={day.date}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {day.calls}
                        </span>
                        <div className="relative w-full max-w-[40px]">
                          <div
                            className="w-full rounded-t bg-primary/20 transition-all"
                            style={{ height: `${height}px` }}
                          />
                          {bookingHeight > 0 && (
                            <div
                              className="absolute bottom-0 w-full rounded-t bg-primary transition-all"
                              style={{ height: `${bookingHeight}px` }}
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-primary/20" />
                    Calls
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-primary" />
                    Bookings
                  </span>
                </div>
              </div>

              {/* Status Breakdown + Recent Calls */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Call Status Breakdown */}
                <div className="rounded-xl border border-border p-6">
                  <h3 className="mb-4 text-sm font-semibold">
                    Call Status (Last 30 Days)
                  </h3>
                  {stats.statusBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.statusBreakdown.map((s) => {
                        const total = stats.statusBreakdown.reduce(
                          (sum, x) => sum + x.count,
                          0
                        );
                        const pct =
                          total > 0
                            ? Math.round((s.count / total) * 100)
                            : 0;
                        return (
                          <div key={s.status}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <StatusDot status={s.status} />
                                {formatStatus(s.status)}
                              </span>
                              <span className="font-medium">
                                {s.count}{" "}
                                <span className="text-muted-foreground font-normal">
                                  ({pct}%)
                                </span>
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${statusColor(s.status)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Conversations */}
                <div className="rounded-xl border border-border p-6">
                  <h3 className="mb-4 text-sm font-semibold">
                    Recent Calls
                  </h3>
                  {stats.recentConversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No calls yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentConversations.map((c) => (
                        <a
                          key={c.id}
                          href={`/conversations/${c.id}`}
                          className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {c.callerName || c.callerPhone || "Unknown caller"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo(c.startedAt)}
                              {c.endedAt && c.startedAt && (
                                <> &middot; {formatDuration(
                                  Math.round(
                                    (new Date(c.endedAt).getTime() -
                                      new Date(c.startedAt).getTime()) /
                                      1000
                                  )
                                )}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {c.bookingMade && (
                              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                                Booked
                              </span>
                            )}
                            <StatusDot status={c.status} />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "COMPLETED"
      ? "bg-green-500"
      : status === "IN_PROGRESS"
        ? "bg-blue-500"
        : status === "MISSED"
          ? "bg-yellow-500"
          : "bg-red-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "MISSED":
      return "bg-yellow-500";
    case "FAILED":
      return "bg-red-500";
    default:
      return "bg-muted-foreground";
  }
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
