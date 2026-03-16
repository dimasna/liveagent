"use client";

import { format, differenceInMinutes, parseISO, isSameDay } from "date-fns";

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
  start: string;
  end: string;
  status: string;
  resourceId: string | null;
  resourceName: string | null;
}

interface TimelineViewProps {
  resources: Resource[];
  bookings: Booking[];
  date: Date;
  operatingHours?: { open: string; close: string } | null;
}

export function TimelineView({
  resources,
  bookings,
  date,
  operatingHours,
}: TimelineViewProps) {
  const startHour = operatingHours
    ? parseInt(operatingHours.open.split(":")[0])
    : 8;
  const endHour = operatingHours
    ? Math.min(parseInt(operatingHours.close.split(":")[0]) + 1, 24)
    : 22;
  const totalHours = endHour - startHour;
  const now = new Date();
  const isToday = isSameDay(date, now);

  // Current time position (percentage)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timelineStartMin = startHour * 60;
  const timelineEndMin = endHour * 60;
  const currentPct =
    ((currentMinutes - timelineStartMin) / (timelineEndMin - timelineStartMin)) *
    100;

  function getBookingsForResource(resourceId: string) {
    return bookings.filter((b) => b.resourceId === resourceId);
  }

  function getBookingPosition(booking: Booking) {
    const bStart = parseISO(booking.start);
    const bEnd = parseISO(booking.end);
    const startMin = bStart.getHours() * 60 + bStart.getMinutes();
    const endMin = bEnd.getHours() * 60 + bEnd.getMinutes();

    const left =
      ((startMin - timelineStartMin) / (timelineEndMin - timelineStartMin)) *
      100;
    const width =
      ((endMin - startMin) / (timelineEndMin - timelineStartMin)) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100 - left)}%` };
  }

  // Unassigned bookings (no resource mapped)
  const unassignedBookings = bookings.filter((b) => !b.resourceId);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Time header */}
        <div className="flex border-b border-border">
          <div className="w-36 flex-shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground">
            Resource
          </div>
          <div className="relative flex-1">
            <div className="flex">
              {Array.from({ length: totalHours }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 border-l border-border px-1 py-2"
                >
                  <span className="text-[10px] text-muted-foreground">
                    {format(
                      new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour + i),
                      "ha"
                    ).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource rows */}
        {resources.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No resources configured. Set up resources in agent settings.
          </div>
        ) : (
          resources.map((resource) => {
            const resBookings = getBookingsForResource(resource.id);

            return (
              <div
                key={resource.id}
                className="flex border-b border-border hover:bg-accent/30 transition-colors"
              >
                {/* Resource label */}
                <div className="w-36 flex-shrink-0 flex items-center px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {resource.name}
                    </p>
                    {resource.capacity > 1 && (
                      <p className="text-[10px] text-muted-foreground">
                        {resource.capacity} seats
                      </p>
                    )}
                  </div>
                </div>

                {/* Timeline cells */}
                <div className="relative flex-1 min-h-[48px]">
                  {/* Hour grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: totalHours }, (_, i) => (
                      <div key={i} className="flex-1 border-l border-border/50" />
                    ))}
                  </div>

                  {/* Current time indicator */}
                  {isToday &&
                    currentPct >= 0 &&
                    currentPct <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                        style={{ left: `${currentPct}%` }}
                      >
                        <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-red-500" />
                      </div>
                    )}

                  {/* Booking blocks */}
                  {resBookings.map((booking) => {
                    const pos = getBookingPosition(booking);
                    const duration = differenceInMinutes(
                      parseISO(booking.end),
                      parseISO(booking.start)
                    );

                    return (
                      <div
                        key={booking.id}
                        className="absolute top-1 bottom-1 rounded-md bg-brand/15 border border-brand/30 px-2 flex items-center overflow-hidden cursor-default group hover:bg-brand/25 transition-colors"
                        style={{ left: pos.left, width: pos.width }}
                        title={`${booking.callerName || booking.title} • ${format(parseISO(booking.start), "h:mm a")} - ${format(parseISO(booking.end), "h:mm a")} (${duration}min)`}
                      >
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {booking.callerName || booking.title}
                        </p>
                      </div>
                    );
                  })}

                  {/* Empty state for this row */}
                  {resBookings.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-muted-foreground/40">
                        available
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Unassigned bookings */}
        {unassignedBookings.length > 0 && (
          <div className="flex border-b border-border bg-yellow-500/5">
            <div className="w-36 flex-shrink-0 flex items-center px-3 py-3">
              <p className="text-xs font-medium text-yellow-400">
                Unassigned
              </p>
            </div>
            <div className="relative flex-1 min-h-[48px]">
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: totalHours }, (_, i) => (
                  <div key={i} className="flex-1 border-l border-border/50" />
                ))}
              </div>
              {unassignedBookings.map((booking) => {
                const pos = getBookingPosition(booking);
                return (
                  <div
                    key={booking.id}
                    className="absolute top-1 bottom-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 px-2 flex items-center overflow-hidden"
                    style={{ left: pos.left, width: pos.width }}
                  >
                    <p className="text-[11px] font-medium text-yellow-400 truncate">
                      {booking.callerName || booking.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
