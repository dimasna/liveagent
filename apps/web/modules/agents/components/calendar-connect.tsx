"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Calendar {
  id: string;
  name: string;
  primary: boolean;
  color: string;
  accessRole: string;
}

interface CalendarConnectProps {
  agentId: string;
  calendarId: string | null;
  onUpdate: (calendarId: string | null) => void;
}

export function CalendarConnect({
  agentId,
  calendarId,
  onUpdate,
}: CalendarConnectProps) {
  const searchParams = useSearchParams();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(calendarId || "");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Handle OAuth redirect result
  useEffect(() => {
    const calendarStatus = searchParams.get("calendar");
    if (calendarStatus === "connected") {
      setToast({ type: "success", message: "Google Calendar connected!" });
      loadCalendars();
    } else if (calendarStatus === "error") {
      const message =
        searchParams.get("message") || "Failed to connect calendar";
      setToast({ type: "error", message });
    }
  }, [searchParams]);

  // Load calendar list when connected
  useEffect(() => {
    if (calendarId) {
      loadCalendars();
    }
  }, [calendarId]);

  async function loadCalendars() {
    setLoadingCalendars(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/calendar/calendars`);
      if (res.ok) {
        const data = await res.json();
        setCalendars(Array.isArray(data.calendars) ? data.calendars : []);
        setSelectedId(data.selectedCalendarId || "");
      }
    } catch {
      // Silently fail — calendar might not be connected
    } finally {
      setLoadingCalendars(false);
    }
  }

  async function startConnect() {
    setConnecting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/calendar/connect`);
      const data = await res.json();

      if (data.url) {
        // Redirect to Google OAuth consent screen
        window.location.href = data.url;
      } else {
        setToast({
          type: "error",
          message: data.error || "Failed to start OAuth flow",
        });
        setConnecting(false);
      }
    } catch {
      setToast({ type: "error", message: "Failed to connect" });
      setConnecting(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await fetch(`/api/agents/${agentId}/calendar`, { method: "DELETE" });
      setCalendars([]);
      setSelectedId("");
      onUpdate(null);
      setToast({ type: "success", message: "Calendar disconnected" });
    } catch {
      setToast({ type: "error", message: "Failed to disconnect" });
    } finally {
      setDisconnecting(false);
    }
  }

  async function selectCalendar(newCalendarId: string) {
    setSelectedId(newCalendarId);
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/calendar/calendars`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: newCalendarId }),
      });

      if (res.ok) {
        onUpdate(newCalendarId);
        setToast({ type: "success", message: "Calendar updated" });
      } else {
        setToast({ type: "error", message: "Failed to update calendar" });
      }
    } catch {
      setToast({ type: "error", message: "Failed to update calendar" });
    } finally {
      setSaving(false);
    }
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isConnected = !!calendarId;

  return (
    <div className="rounded-xl border border-border p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold">Google Calendar</h2>
            <p className="text-xs text-muted-foreground">
              {isConnected
                ? "Your agent can check availability and create bookings"
                : "Connect to enable booking management"}
            </p>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Connected
            </span>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {toast.message}
        </div>
      )}

      {!isConnected ? (
        /* Not connected state */
        <div>
          <div className="mb-4 rounded-lg bg-muted p-4">
            <h3 className="mb-2 text-sm font-medium">How it works</h3>
            <ol className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-medium text-brand">
                  1
                </span>
                Connect your Google account
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-medium text-brand">
                  2
                </span>
                Choose which calendar the agent should use
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-medium text-brand">
                  3
                </span>
                Your agent can now check availability and create bookings
              </li>
            </ol>
          </div>
          <button
            onClick={startConnect}
            disabled={connecting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            {connecting ? (
              "Redirecting to Google..."
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect Google Calendar
              </>
            )}
          </button>
        </div>
      ) : (
        /* Connected state */
        <div className="space-y-4">
          {/* Calendar selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Active Calendar
            </label>
            {loadingCalendars ? (
              <div className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-muted-foreground">
                Loading calendars...
              </div>
            ) : calendars.length > 0 ? (
              <div className="space-y-2">
                {calendars
                  .filter(
                    (c) => c.accessRole === "owner" || c.accessRole === "writer"
                  )
                  .map((cal) => (
                    <label
                      key={cal.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                        selectedId === cal.id
                          ? "border-brand bg-brand/5"
                          : "border-border hover:bg-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="calendar"
                        value={cal.id}
                        checked={selectedId === cal.id}
                        onChange={() => selectCalendar(cal.id)}
                        disabled={saving}
                        className="accent-brand"
                      />
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cal.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {cal.name}
                          {cal.primary && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (Primary)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cal.id}
                        </p>
                      </div>
                      {selectedId === cal.id && (
                        <svg
                          className="h-4 w-4 text-brand"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </label>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No writable calendars found.{" "}
                <button
                  onClick={loadCalendars}
                  className="text-brand hover:underline"
                >
                  Refresh
                </button>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={loadCalendars}
              disabled={loadingCalendars}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {loadingCalendars ? "Refreshing..." : "Refresh calendars"}
            </button>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="text-sm text-destructive hover:underline"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
