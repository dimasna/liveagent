"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ConversationListItemProps {
  conversation: {
    id: string;
    callerPhone: string | null;
    callerName: string | null;
    callerEmail: string | null;
    status: string;
    bookingMade: boolean;
    summary: string | null;
    startedAt: string;
    agent: { name: string };
  };
}

export function ConversationListItem({
  conversation: conv,
}: ConversationListItemProps) {
  return (
    <Link
      href={`/conversations/${conv.id}`}
      className="block rounded-xl border border-border p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {(conv.callerName || conv.callerEmail || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium">
              {conv.callerName || conv.callerEmail || conv.callerPhone || "Unknown Caller"}
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
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              Booked
            </span>
          )}
          <StatusBadge status={conv.status} />
        </div>
      </div>
      {conv.summary && (
        <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
          {conv.summary}
        </p>
      )}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED:
      "bg-blue-500/10 text-blue-400",
    IN_PROGRESS:
      "bg-yellow-500/10 text-yellow-400",
    MISSED: "bg-muted text-muted-foreground",
    FAILED: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
