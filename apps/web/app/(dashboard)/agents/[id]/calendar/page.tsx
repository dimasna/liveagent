"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  format,
  startOfDay,
  addDays,
  isSameDay,
} from "date-fns";
import {
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutListIcon,
  LayoutGridIcon,
  CalendarIcon,
} from "lucide-react";
import { TimelineView } from "@modules/bookings/components/timeline-view";
import { CardGridView } from "@modules/bookings/components/card-grid-view";

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
}

interface Booking {
  id: string;
  title: string;
  callerName: string | null;
  callerPhone: string | null;
  start: string;
  end: string;
  status: string;
  resourceId: string | null;
  resourceName: string | null;
  resourceType: string | null;
}

interface Agent {
  id: string;
  name: string;
  calendarId: string | null;
  operatingHours: Record<string, { open: string; close: string } | null> | null;
  capacityType: string;
  capacityCount: number;
}

type ViewMode = "timeline" | "grid";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function BookingsPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  // Fetch agent
  useEffect(() => {
    fetch(`/api/agents/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAgent(data);
      });
  }, [id]);

  // Fetch bookings + resources for selected date
  useEffect(() => {
    setLoading(true);
    const from = selectedDate.toISOString();
    const to = addDays(selectedDate, 1).toISOString();

    fetch(`/api/agents/${id}/bookings?from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setBookings(data.bookings || []);
          setResources(data.resources || []);
        } else {
          setBookings([]);
          setResources([]);
        }
      })
      .catch(() => {
        setBookings([]);
        setResources([]);
      })
      .finally(() => setLoading(false));
  }, [id, selectedDate]);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const dayKey = DAY_KEYS[selectedDate.getDay()];
  const operatingHoursForDay = agent?.operatingHours?.[dayKey] ?? null;

  function prevDay() {
    setSelectedDate((d) => addDays(d, -1));
  }

  function nextDay() {
    setSelectedDate((d) => addDays(d, 1));
  }

  function goToday() {
    setSelectedDate(startOfDay(new Date()));
  }

  // Stats
  const totalResources = resources.length;
  const bookedResources = new Set(
    bookings.filter((b) => b.resourceId).map((b) => b.resourceId)
  ).size;
  const availableResources = totalResources - bookedResources;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Bookings</h1>
            <p className="text-sm text-muted-foreground">
              {agent?.calendarId
                ? "Manage bookings and resource availability"
                : "Connect Google Calendar to view and manage bookings"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  viewMode === "timeline"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutListIcon className="h-3.5 w-3.5" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  viewMode === "grid"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGridIcon className="h-3.5 w-3.5" />
                Grid
              </button>
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToday}
                className={`rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent ${
                  isToday ? "bg-accent" : ""
                }`}
              >
                Today
              </button>
              <button
                onClick={prevDay}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={nextDay}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium ml-1">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !agent?.calendarId && resources.length === 0 ? (
          /* No calendar + no resources */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">No bookings set up</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Connect Google Calendar in Integrations and set up resources to
              start managing bookings.
            </p>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            {totalResources > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <span className="text-sm font-semibold">{totalResources}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Booked:</span>
                  <span className="text-sm font-semibold">{bookedResources}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Available:</span>
                  <span className="text-sm font-semibold">{availableResources}</span>
                </div>
                {operatingHoursForDay && (
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 ml-auto">
                    <span className="text-xs text-muted-foreground">Hours:</span>
                    <span className="text-sm font-medium">
                      {operatingHoursForDay.open} – {operatingHoursForDay.close}
                    </span>
                  </div>
                )}
                {!operatingHoursForDay && (
                  <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 ml-auto">
                    <span className="text-xs text-yellow-400 font-medium">
                      Closed today
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Closed day message */}
            {!operatingHoursForDay && totalResources > 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">
                  Business is closed on {format(selectedDate, "EEEE")}
                </p>
                {bookings.length > 0 && (
                  <p className="mt-2 text-sm text-yellow-400">
                    {bookings.length} booking{bookings.length > 1 ? "s" : ""}{" "}
                    still scheduled
                  </p>
                )}
              </div>
            ) : viewMode === "timeline" ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <TimelineView
                  resources={resources}
                  bookings={bookings}
                  date={selectedDate}
                  operatingHours={operatingHoursForDay}
                />
              </div>
            ) : (
              <CardGridView
                resources={resources}
                bookings={bookings}
                date={selectedDate}
              />
            )}

            {/* Booking list below */}
            {bookings.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold">
                  Today&apos;s Bookings ({bookings.length})
                </h3>
                <div className="space-y-2">
                  {bookings
                    .sort(
                      (a, b) =>
                        new Date(a.start).getTime() -
                        new Date(b.start).getTime()
                    )
                    .map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium text-foreground">
                            {(b.callerName?.[0] || "B").toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {b.callerName || b.title || "Booking"}
                            </p>
                            <div className="flex items-center gap-2">
                              {b.resourceName && (
                                <span className="text-[10px] font-medium rounded-full bg-accent px-2 py-0.5">
                                  {b.resourceName}
                                </span>
                              )}
                              {b.callerPhone && (
                                <span className="text-xs text-muted-foreground">
                                  {b.callerPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(b.start), "h:mm a")}
                            {b.end &&
                              ` – ${format(new Date(b.end), "h:mm a")}`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {bookings.length === 0 && agent?.calendarId && operatingHoursForDay && (
              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">
                  No bookings for {format(selectedDate, "MMMM d")}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
