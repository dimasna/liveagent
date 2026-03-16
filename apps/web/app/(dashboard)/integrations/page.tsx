"use client";

import { useState, useEffect } from "react";
import {
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  ExternalLinkIcon,
} from "lucide-react";

interface WorkspaceCalendarStatus {
  connected: boolean;
  email: string | null;
}

export default function IntegrationsPage() {
  const [calendarStatus, setCalendarStatus] =
    useState<WorkspaceCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/calendar");
      if (res.ok) {
        setCalendarStatus(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  // Re-check on window focus (after OAuth popup closes)
  useEffect(() => {
    function onFocus() {
      fetchStatus();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function connectGoogle() {
    window.open(
      "/api/workspace/calendar/connect",
      "workspace-google-connect",
      "width=600,height=700,left=200,top=100"
    );
  }

  async function disconnectGoogle() {
    if (
      !confirm(
        "Disconnect Google Calendar? Existing agent calendars will continue to work, but new agents won't get auto-created calendars."
      )
    )
      return;

    setDisconnecting(true);
    try {
      const res = await fetch("/api/workspace/calendar", { method: "DELETE" });
      if (res.ok) {
        setCalendarStatus({ connected: false, email: null });
      }
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Connections</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Connect third-party services to your workspace. These connections are
          shared across all agents.
        </p>
      </div>

      {/* Google Calendar */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-start gap-4 p-6">
          {/* Google Calendar icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold">Google Calendar</h3>
              {!loading && calendarStatus?.connected && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Connected
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mt-1">
              When connected, new agents automatically get a dedicated Google
              Calendar for managing bookings and sending reminders.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 mt-4">
                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-[13px] text-muted-foreground">
                  Checking connection...
                </span>
              </div>
            ) : calendarStatus?.connected ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2.5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                  <CheckCircle2Icon className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-green-300">
                      Connected as {calendarStatus.email}
                    </p>
                    <p className="text-[12px] text-green-400/60">
                      New agents will automatically receive a booking calendar
                    </p>
                  </div>
                </div>
                <button
                  onClick={disconnectGoogle}
                  disabled={disconnecting}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {disconnecting ? (
                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircleIcon className="h-3.5 w-3.5" />
                  )}
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <button
                  onClick={connectGoogle}
                  className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-medium text-background hover:bg-foreground/90 transition-colors"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Connect Google Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
