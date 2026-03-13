"use client";

import { useState, useCallback } from "react";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { CallButton } from "./call-button";
import { Transcript } from "./transcript";
import type { BookingConfirmation } from "@/hooks/use-voice-session";

interface VoiceWidgetProps {
  agentId: string;
  color?: string;
  greeting?: string;
}

/**
 * Main voice widget component.
 * Renders the full call UI: greeting, call controls,
 * live transcript, and booking confirmation.
 */
export function VoiceWidget({
  agentId,
  color = "#3b82f6",
  greeting = "Hi! I'm ready to help you book an appointment. Tap the call button to start a voice conversation.",
}: VoiceWidgetProps) {
  const {
    connect,
    disconnect,
    sendText,
    state,
    transcript,
    bookingConfirmation,
    isMuted,
    toggleMute,
    error,
  } = useVoiceSession();

  const [textInput, setTextInput] = useState("");

  const handleCallToggle = useCallback(() => {
    if (state === "connected" || state === "connecting") {
      disconnect();
    } else {
      connect(agentId);
    }
  }, [state, agentId, connect, disconnect]);

  const handleSendText = useCallback(() => {
    const trimmed = textInput.trim();
    if (trimmed) {
      sendText(trimmed);
      setTextInput("");
    }
  }, [textInput, sendText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText],
  );

  const isActive = state === "connected";
  const isConnecting = state === "connecting";

  return (
    <div className="liveagent-widget flex flex-col h-full bg-white">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Mic animation when active */}
          {isActive && (
            <div className="flex items-end gap-0.5 h-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="liveagent-mic-bar w-1 bg-white rounded-full"
                  style={{ height: "100%", transformOrigin: "bottom" }}
                />
              ))}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {isActive ? "Call in progress" : isConnecting ? "Connecting..." : "Voice Assistant"}
            </h2>
            {isActive && (
              <p className="text-xs opacity-80">
                {isMuted ? "Muted" : "Listening..."}
              </p>
            )}
          </div>
        </div>

        {/* Mute button (only when connected) */}
        {isActive && (
          <button
            onClick={toggleMute}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full
              transition-colors duration-150
              ${isMuted ? "bg-red-500/30" : "bg-white/20 hover:bg-white/30"}
            `}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 text-xs shrink-0">
          {error}
        </div>
      )}

      {/* Greeting (shown when idle) */}
      {state === "idle" && transcript.length === 0 && !bookingConfirmation && (
        <div className="px-4 py-6 text-center shrink-0">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${color}15` }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed max-w-[280px] mx-auto">
            {greeting}
          </p>
        </div>
      )}

      {/* Transcript */}
      <Transcript entries={transcript} />

      {/* Booking confirmation card */}
      {bookingConfirmation && (
        <BookingCard booking={bookingConfirmation} color={color} />
      )}

      {/* Bottom controls */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-3">
        {/* Text input (available when connected) */}
        {isActive && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            <button
              onClick={handleSendText}
              disabled={!textInput.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600 transition-colors"
              aria-label="Send message"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* Call button centered */}
        <div className="flex justify-center">
          <CallButton
            state={state}
            onClick={handleCallToggle}
            color={color}
          />
        </div>

        {state === "idle" && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Tap to start a voice call
          </p>
        )}
      </div>
    </div>
  );
}

// --- Booking confirmation card ---

function BookingCard({
  booking,
  color,
}: {
  booking: BookingConfirmation;
  color: string;
}) {
  return (
    <div className="mx-4 mb-3 rounded-xl border border-green-200 bg-green-50 p-4 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-green-800">
          Booking Confirmed
        </h3>
      </div>

      <div className="space-y-1.5 text-sm text-green-900">
        <div className="flex justify-between">
          <span className="text-green-700">Service</span>
          <span className="font-medium">{booking.service}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Date</span>
          <span className="font-medium">{booking.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Time</span>
          <span className="font-medium">{booking.time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Name</span>
          <span className="font-medium">{booking.customerName}</span>
        </div>
        {booking.customerEmail && (
          <div className="flex justify-between">
            <span className="text-green-700">Email</span>
            <span className="font-medium">{booking.customerEmail}</span>
          </div>
        )}
      </div>

      {booking.id && (
        <p className="mt-3 text-xs text-green-600">
          Confirmation #{booking.id}
        </p>
      )}
    </div>
  );
}
