"use client";

import { format } from "date-fns";

interface MessageBubbleProps {
  message: {
    id: string;
    role: string;
    content: string;
    createdAt: string;
  };
}

export function MessageBubble({ message: msg }: MessageBubbleProps) {
  const isUser = msg.role === "USER";
  const isTool = msg.role === "TOOL";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-brand text-brand-foreground"
            : isTool
              ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
              : "bg-muted"
        }`}
      >
        {isTool && (
          <p className="mb-1 text-xs font-medium uppercase opacity-60">
            Tool Call
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        <p className="mt-1 text-xs opacity-60">
          {format(new Date(msg.createdAt), "p")}
        </p>
      </div>
    </div>
  );
}
