"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/hooks/use-voice-session";

interface TranscriptProps {
  entries: TranscriptEntry[];
}

/**
 * Scrollable transcript display showing the conversation
 * between user and agent in real time.
 */
export function Transcript({ entries }: TranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm px-4">
        <p className="text-center">
          Your conversation will appear here once the call starts.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      role="log"
      aria-label="Call transcript"
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`
              max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed
              ${
                entry.role === "user"
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-800 rounded-bl-md"
              }
              ${!entry.isFinal ? "opacity-60" : ""}
            `}
          >
            <p className="whitespace-pre-wrap break-words">{entry.text}</p>
            {!entry.isFinal && (
              <span className="inline-block text-xs mt-0.5 opacity-70">
                ...
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
