"use client";

import type {
  BookingConfirmation,
  BookingPhase,
} from "@/hooks/use-voice-session";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function BookingCard({
  phase,
  booking,
  emailSent,
}: {
  phase: BookingPhase;
  booking: BookingConfirmation | null;
  emailSent: boolean;
}) {
  const isConfirming = phase === "confirming";
  const isConfirmed = phase === "confirmed";
  const hasSentEmail = isConfirmed && emailSent;
  const hasPendingEmail =
    isConfirmed && !!booking?.attendeeEmail && !emailSent;

  const peopleMatch = booking?.summary?.match(
    /(\d+)\s*(?:people|person|guest|pax)/i
  );
  const people = peopleMatch ? peopleMatch[1] : null;

  return (
    <div
      className={`w-full rounded-xl border p-4 transition-all duration-500 ${
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
              <svg
                className="w-3 h-3 text-amber-400 animate-spin"
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
            </div>
            <span className="text-[13px] font-semibold text-amber-400">
              Confirming booking...
            </span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
              <svg
                width="12"
                height="12"
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
            <span className="text-[13px] font-semibold text-green-400">
              {hasSentEmail ? "Confirmed & Sent" : "Booking Confirmed"}
            </span>
          </>
        )}
      </div>

      {/* Details */}
      {isConfirmed && booking && (
        <div className="space-y-2 text-[12px]">
          {booking.start && (
            <div className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-green-400/50 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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

          {booking.resourceName && (
            <div className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-green-400/50 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span className="text-green-300">{booking.resourceName}</span>
            </div>
          )}

          {people && (
            <div className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-green-400/50 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-green-300">
                {people} {parseInt(people) === 1 ? "person" : "people"}
              </span>
            </div>
          )}

          {/* Email — pending confirmation or sent */}
          {booking.attendeeEmail && (
            <div className="flex items-center gap-2">
              <svg
                className={`w-3.5 h-3.5 shrink-0 ${hasPendingEmail ? "text-amber-400/50" : "text-green-400/50"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span
                className={
                  hasPendingEmail ? "text-amber-300" : "text-green-300"
                }
              >
                {booking.attendeeEmail}
              </span>
              {hasPendingEmail && (
                <span className="text-[10px] text-amber-400/60">Confirm?</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {isConfirmed && booking?.id && (
        <p className="mt-3 pt-2 border-t border-green-500/10 text-[11px] text-green-400/40">
          Confirmation #{String(booking.id).slice(-8)}
          {booking.attendeeEmail && emailSent && " · Calendar invite sent"}
        </p>
      )}
    </div>
  );
}
