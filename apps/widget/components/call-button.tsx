"use client";

import type { ConnectionState } from "@/hooks/use-voice-session";

interface CallButtonProps {
  state: ConnectionState;
  onClick: () => void;
  color?: string;
}

/**
 * Floating call button with visual states:
 * - idle: pulsing blue ring
 * - connecting: spinning animation
 * - connected: green glow
 * - error: red tint
 */
export function CallButton({
  state,
  onClick,
  color = "#3b82f6",
}: CallButtonProps) {
  const isActive = state === "connected";
  const isConnecting = state === "connecting";
  const isError = state === "error";

  const buttonColor = isActive
    ? "#22c55e"
    : isError
      ? "#ef4444"
      : color;

  const animationClass = isActive
    ? "liveagent-glow"
    : state === "idle"
      ? "liveagent-pulse"
      : "";

  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className={`
        relative flex items-center justify-center
        w-14 h-14 rounded-full border-none cursor-pointer
        transition-all duration-200 ease-in-out
        ${animationClass}
        ${isConnecting ? "opacity-80" : "hover:scale-105 active:scale-95"}
      `}
      style={{
        backgroundColor: buttonColor,
        color: "white",
      }}
      aria-label={
        isActive
          ? "End call"
          : isConnecting
            ? "Connecting..."
            : "Start voice call"
      }
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
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="32"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : isActive ? (
        /* End call icon (phone down) */
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        /* Phone icon */
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      )}
    </button>
  );
}
