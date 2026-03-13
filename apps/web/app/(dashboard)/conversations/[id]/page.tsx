"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  callerPhone: string | null;
  callerName: string | null;
  callerEmail: string | null;
  status: string;
  bookingMade: boolean;
  bookingStart: string | null;
  bookingEnd: string | null;
  summary: string | null;
  startedAt: string;
  endedAt: string | null;
  agent: { name: string; businessName: string };
  messages: Message[];
}

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetch(`/api/conversations/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setConversation(data); });
  }, [id]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {conversation.callerName || conversation.callerPhone || "Unknown Caller"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {conversation.agent.name} &middot;{" "}
              {format(new Date(conversation.startedAt), "PPp")}
              {conversation.endedAt &&
                ` — ${format(new Date(conversation.endedAt), "p")}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {conversation.bookingMade && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                Booking Made
              </span>
            )}
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
              {conversation.status}
            </span>
          </div>
        </div>

        {/* Booking details */}
        {conversation.bookingStart && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-950">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Booking:{" "}
              {format(new Date(conversation.bookingStart), "PPp")} —{" "}
              {conversation.bookingEnd &&
                format(new Date(conversation.bookingEnd), "p")}
            </p>
          </div>
        )}

        {conversation.summary && (
          <p className="mt-3 text-sm text-muted-foreground">
            {conversation.summary}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "USER" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "USER"
                    ? "bg-brand text-brand-foreground"
                    : msg.role === "TOOL"
                      ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                      : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="mt-1 text-xs opacity-60">
                  {format(new Date(msg.createdAt), "p")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
