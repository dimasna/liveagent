"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { BookingCard } from "./booking-card";
import { VOICE_PERSONAS } from "@liveagent/shared";

interface CallScreenProps {
  agentId: string;
  agentName: string;
  businessName: string;
  voice: string;
}

export function CallScreen({
  agentId,
  agentName,
  businessName,
  voice,
}: CallScreenProps) {
  const {
    connect,
    disconnect,
    state,
    bookingConfirmation,
    bookingPhase,
    emailSent,
    error,
  } = useVoiceSession();

  // Call duration timer
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === "connected") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Resolve voice persona color for waveform
  const persona = VOICE_PERSONAS.find((p) => p.id === voice);
  const colorMap: Record<string, string> = {
    "bg-blue-500": "#3b82f6",
    "bg-slate-600": "#475569",
    "bg-pink-500": "#ec4899",
    "bg-amber-600": "#d97706",
    "bg-purple-500": "#a855f7",
    "bg-emerald-500": "#10b981",
    "bg-cyan-500": "#06b6d4",
    "bg-rose-500": "#f43f5e",
  };
  const barColor = colorMap[persona?.color || ""] || "#3b82f6";

  const handleCall = useCallback(() => {
    if (state === "connected" || state === "connecting") {
      disconnect();
    } else {
      connect(agentId);
    }
  }, [state, agentId, connect, disconnect]);

  const isIdle = state === "idle" || state === "error";
  const isConnecting = state === "connecting";
  const isConnected = state === "connected";

  const statusText = isConnecting
    ? "Calling..."
    : isConnected
      ? formatDuration(duration)
      : "Tap to call";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] relative">
      {/* Error banner */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* Top section: agent info + status */}
      <div className="shrink-0 pt-16 pb-4 text-center">
        <p className="text-sm text-gray-400">{businessName}</p>
        <h1 className="text-xl font-semibold mt-1 text-white">{agentName}</h1>
        <p
          className={`text-sm mt-2 ${isConnected ? "text-green-400" : "text-gray-500"}`}
        >
          {statusText}
        </p>
      </div>

      {/* Center: Waveform + booking card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative">
          {/* Ripple ring when connected */}
          {isConnected && (
            <div
              className="call-ripple absolute inset-0 rounded-full border-2"
              style={{ borderColor: `${barColor}30` }}
            />
          )}
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected || isConnecting ? "" : "cursor-pointer"
            }`}
            style={{
              backgroundColor: `${barColor}${isConnected ? "08" : isConnecting ? "05" : "06"}`,
            }}
            onClick={isIdle ? handleCall : undefined}
          >
            <div
              className={`flex items-center gap-[5px] ${
                !isConnected && !isConnecting
                  ? "call-wave-muted"
                  : isConnecting
                    ? "call-wave-connecting"
                    : ""
              }`}
            >
              {[
                { height: 20, baseOpacity: 0.35 },
                { height: 36, baseOpacity: 0.55 },
                { height: 52, baseOpacity: 1.0 },
                { height: 34, baseOpacity: 0.55 },
                { height: 18, baseOpacity: 0.35 },
              ].map((bar, i) => (
                <div
                  key={i}
                  className="call-wave-bar rounded-full transition-opacity duration-300"
                  style={{
                    width: 7,
                    height: bar.height,
                    backgroundColor: barColor,
                    opacity: !isConnected && !isConnecting ? bar.baseOpacity * 0.2 : bar.baseOpacity * 0.8,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Booking card overlay */}
        {bookingPhase !== "idle" && (
          <div className="mt-8 w-full max-w-sm">
            <BookingCard
              phase={bookingPhase}
              booking={bookingConfirmation}
              emailSent={emailSent}
            />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 pb-12 pt-6">
        <div className="flex items-center justify-center">
          <button
            onClick={handleCall}
            disabled={isConnecting}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isConnected
                ? "bg-red-500 hover:bg-red-600"
                : isConnecting
                  ? "bg-red-500 opacity-70"
                  : "bg-green-500 hover:bg-green-600 active:scale-95"
            }`}
            aria-label={isIdle ? "Start call" : "End call"}
          >
            {isConnecting ? (
              <svg
                className="animate-spin"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray="32"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : isConnected ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Powered by footer */}
      <div className="shrink-0 pb-4 text-center">
        <a
          href="https://liveagent.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          Powered by{" "}
          <span className="font-medium text-gray-500">liveagent.dev</span>
        </a>
      </div>
    </div>
  );
}
