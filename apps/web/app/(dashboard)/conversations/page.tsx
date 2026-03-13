"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  callerPhone: string | null;
  callerName: string | null;
  status: string;
  bookingMade: boolean;
  summary: string | null;
  startedAt: string;
  endedAt: string | null;
  agent: { name: string; businessName: string };
  messages: { content: string }[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    fetch(`/api/conversations?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            View and review all call transcripts
          </p>
        </div>
        <div className="flex gap-2">
          {["", "IN_PROGRESS", "COMPLETED", "MISSED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                filter === s
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/conversations/${conv.id}`}
              className="block rounded-xl border border-border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {conv.callerName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {conv.callerName || conv.callerPhone || "Unknown Caller"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conv.agent.name} &middot;{" "}
                      {formatDistanceToNow(new Date(conv.startedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {conv.bookingMade && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      Booked
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      conv.status === "COMPLETED"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : conv.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {conv.status}
                  </span>
                </div>
              </div>
              {conv.summary && (
                <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                  {conv.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
