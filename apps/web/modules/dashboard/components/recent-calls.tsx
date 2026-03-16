"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface RecentCall {
  id: string;
  callerName: string | null;
  callerPhone: string | null;
  callerEmail: string | null;
  status: string;
  bookingMade: boolean;
  startedAt: string;
  agent: { name: string };
}

export function RecentCalls({ calls }: { calls: RecentCall[] }) {
  if (calls.length === 0) {
    return (
      <div className="rounded-xl border border-border p-6">
        <h3 className="mb-4 font-semibold">Recent Calls</h3>
        <p className="text-sm text-muted-foreground">
          No calls yet. Test your agent to see calls here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-6">
      <h3 className="mb-4 font-semibold">Recent Calls</h3>
      <div className="space-y-3">
        {calls.map((call) => (
          <Link
            key={call.id}
            href={`/conversations/${call.id}`}
            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {(call.callerName || call.callerEmail || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {call.callerName || call.callerEmail || call.callerPhone || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {call.agent.name} &middot;{" "}
                  {formatDistanceToNow(new Date(call.startedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            {call.bookingMade && (
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                Booked
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
