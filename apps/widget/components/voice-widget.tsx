"use client";

import { useCallback, useMemo } from "react";
import { useVoiceSession } from "@/hooks/use-voice-session";
import type { BookingConfirmation, BookingPhase } from "@/hooks/use-voice-session";

interface VoiceWidgetProps {
  agentId: string;
  color?: string;
  bgColor?: string;
  greeting?: string;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function VoiceWidget({ agentId, color = "#0a0a0a", bgColor = "#0a0a0a" }: VoiceWidgetProps) {
  const {
    connect,
    disconnect,
    state,
    transcript,
    bookingConfirmation,
    bookingPhase,
    error,
  } = useVoiceSession();

  const handleCallToggle = useCallback(() => {
    if (state === "connected" || state === "connecting") {
      disconnect();
    } else {
      connect(agentId);
    }
  }, [state, agentId, connect, disconnect]);

  const isActive = state === "connected";
  const isConnecting = state === "connecting";
  const isLightBg = bgColor === "#ffffff" || bgColor === "#fff";
  const barColor = color === "#0a0a0a" ? (isLightBg ? "#0a0a0a" : "#ffffff") : color;
  const textPrimary = isLightBg ? "#0a0a0a" : "#ededef";
  const textSecondary = isLightBg ? "#6b6b6b" : "#7a7a7d";
  const cardBg = isLightBg ? "#f5f5f5" : "#1c1c1e";
  const borderColor = isLightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const userBubbleBg = isLightBg ? "#0a0a0a" : "#ffffff";
  const userBubbleText = isLightBg ? "#ffffff" : "#0a0a0a";
  const agentBubbleBg = isLightBg ? "#f0f0f0" : "#1c1c1e";
  const agentBubbleText = isLightBg ? "#0a0a0a" : "#ededef";

  // Filter out tool activity messages
  const visibleTranscript = useMemo(
    () =>
      transcript.filter(
        (e) =>
          !(
            e.role === "agent" &&
            /^(checking|calling|looking up|searching|querying|fetching|running|executing|processing|verifying|retrieving)\s/i.test(
              e.text.trim(),
            )
          ) &&
          !(
            e.role === "agent" &&
            /\b(check_availability|create_booking|get_business_hours|cancel_booking|reschedule_booking|list_bookings)\b/.test(
              e.text,
            )
          ),
      ),
    [transcript],
  );

  return (
    <div className="liveagent-widget flex flex-col h-full" style={{ backgroundColor: bgColor }}>
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs shrink-0">
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Waveform circle */}
        <div className="relative mb-2">
          {isActive && (
            <div
              className="liveagent-ripple absolute inset-0 rounded-full border-2"
              style={{ borderColor: `${barColor}30` }}
            />
          )}
          <button
            onClick={handleCallToggle}
            disabled={isConnecting}
            className="relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
            style={{
              backgroundColor: `${barColor}${isActive ? "08" : isConnecting ? "05" : "06"}`,
            }}
            aria-label={isActive ? "End call" : "Start voice call"}
          >
            <div
              className={`flex items-center gap-1.5 ${
                !isActive && !isConnecting
                  ? "liveagent-wave-muted"
                  : isConnecting
                    ? "liveagent-wave-connecting"
                    : ""
              }`}
            >
              {[
                { height: 14, baseOpacity: 0.35 },
                { height: 26, baseOpacity: 0.55 },
                { height: 38, baseOpacity: 1.0 },
                { height: 24, baseOpacity: 0.55 },
                { height: 12, baseOpacity: 0.35 },
              ].map((bar, i) => (
                <div
                  key={i}
                  className="liveagent-wave-bar rounded-full transition-opacity duration-300"
                  style={{
                    width: 5,
                    height: bar.height,
                    backgroundColor: barColor,
                    opacity: !isActive && !isConnecting ? bar.baseOpacity * 0.2 : bar.baseOpacity * 0.8,
                  }}
                />
              ))}
            </div>
          </button>
        </div>

        {/* Status */}
        <p className="text-sm font-medium mt-3" style={{ color: textPrimary }}>
          {isActive ? "Listening..." : isConnecting ? "Connecting..." : "Booking Agent"}
        </p>
        {(isActive || isConnecting) && (
          <p className="text-xs mt-1" style={{ color: textSecondary }}>
            {isConnecting ? "Setting up your call" : "Speak naturally"}
          </p>
        )}

        {/* Transcript */}
        {visibleTranscript.length > 0 && (
          <div className="w-full mt-6 max-h-[200px] overflow-y-auto space-y-2 scrollbar-thin">
            {visibleTranscript.map((entry) => (
              <div key={entry.id} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[13px] leading-relaxed ${
                    entry.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                  } ${!entry.isFinal ? "opacity-50" : ""}`}
                  style={{
                    backgroundColor: entry.role === "user" ? userBubbleBg : agentBubbleBg,
                    color: entry.role === "user" ? userBubbleText : agentBubbleText,
                  }}
                >
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking card (phased) */}
        {bookingPhase !== "idle" && (
          <BookingCard phase={bookingPhase} booking={bookingConfirmation} />
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 py-4 flex items-center justify-center" style={{ borderTop: `1px solid ${borderColor}` }}>
        <button
          onClick={handleCallToggle}
          disabled={isConnecting}
          className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 ${
            isActive
              ? "hover:opacity-90"
              : isConnecting
                ? "opacity-70"
                : "hover:scale-105 active:scale-95"
          }`}
          style={{
            backgroundColor: isActive ? "#ef4444" : barColor,
            color: isActive ? "#ffffff" : isLightBg ? "#ffffff" : "#0a0a0a",
          }}
          aria-label={isActive ? "End call" : "Start call"}
        >
          {isConnecting ? (
            <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : isActive ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          )}
        </button>
      </div>

      {/* Powered by */}
      <div className="shrink-0 pb-3 pt-1 flex items-center justify-center">
        <a
          href="https://liveagent.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] transition-opacity hover:opacity-80"
          style={{ color: textSecondary }}
        >
          Powered by <span style={{ color: textPrimary, fontWeight: 500 }}>liveagent.dev</span>
        </a>
      </div>
    </div>
  );
}

// --- Phased Booking Card ---

function BookingCard({
  phase,
  booking,
}: {
  phase: BookingPhase;
  booking: BookingConfirmation | null;
}) {
  const isConfirming = phase === "confirming";
  const isConfirmed = phase === "confirmed";
  const hasSentEmail = isConfirmed && !!booking?.attendeeEmail;

  // Parse people count from summary
  const peopleMatch = booking?.summary?.match(/(\d+)\s*(?:people|person|guest|pax)/i);
  const people = peopleMatch ? peopleMatch[1] : null;

  return (
    <div
      className={`w-full mt-4 rounded-xl border p-4 transition-all duration-500 ${
        isConfirming
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-green-500/20 bg-green-500/5"
      }`}
    >
      {/* Phase indicator */}
      <div className="flex items-center gap-2 mb-3">
        {isConfirming ? (
          <>
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-amber-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-amber-400">Confirming booking...</span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-green-400">
              {hasSentEmail ? "Confirmed & Sent" : "Booking Confirmed"}
            </span>
          </>
        )}
      </div>

      {/* Details — only show when confirmed with data */}
      {isConfirmed && booking && (
        <div className="space-y-2 text-[12px]">
          {/* Date & Time */}
          {booking.start && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-green-300">
                {formatDate(booking.start)}, {formatTime(booking.start)}
                {booking.end && ` – ${formatTime(booking.end)}`}
              </span>
            </div>
          )}

          {/* Resource / Table */}
          {booking.resourceName && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span className="text-green-300">{booking.resourceName}</span>
            </div>
          )}

          {/* People */}
          {people && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-green-300">{people} {parseInt(people) === 1 ? "person" : "people"}</span>
            </div>
          )}

          {/* Email sent */}
          {booking.attendeeEmail && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span className="text-green-300">{booking.attendeeEmail}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {isConfirmed && booking?.id && (
        <p className="mt-3 pt-2 border-t border-green-500/10 text-[11px] text-green-400/40">
          Confirmation #{String(booking.id).slice(-8)}
          {booking.attendeeEmail && " · Calendar invite sent"}
        </p>
      )}
    </div>
  );
}
