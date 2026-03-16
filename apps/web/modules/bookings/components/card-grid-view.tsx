"use client";

import { format, parseISO, isBefore, isAfter, isSameDay } from "date-fns";

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
}

interface CardGridViewProps {
  resources: Resource[];
  bookings: Booking[];
  date: Date;
}

type ResourceStatus = "available" | "occupied" | "upcoming";

function getResourceStatus(
  resourceId: string,
  bookings: Booking[],
  now: Date
): {
  status: ResourceStatus;
  currentBooking: Booking | null;
  nextBooking: Booking | null;
} {
  const resBookings = bookings
    .filter((b) => b.resourceId === resourceId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const currentBooking =
    resBookings.find(
      (b) =>
        isBefore(parseISO(b.start), now) && isAfter(parseISO(b.end), now)
    ) ?? null;

  if (currentBooking) {
    return { status: "occupied", currentBooking, nextBooking: null };
  }

  const nextBooking =
    resBookings.find((b) => isAfter(parseISO(b.start), now)) ?? null;

  if (nextBooking) {
    return { status: "upcoming", currentBooking: null, nextBooking };
  }

  return { status: "available", currentBooking: null, nextBooking: null };
}

const STATUS_STYLES: Record<
  ResourceStatus,
  { bg: string; border: string; dot: string; label: string; text: string }
> = {
  available: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    dot: "bg-green-500",
    label: "Available",
    text: "text-green-400",
  },
  occupied: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-500",
    label: "Occupied",
    text: "text-red-400",
  },
  upcoming: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    dot: "bg-yellow-500",
    label: "Upcoming",
    text: "text-yellow-400",
  },
};

export function CardGridView({
  resources,
  bookings,
  date,
}: CardGridViewProps) {
  const now = new Date();
  const isToday = isSameDay(date, now);
  const referenceTime = isToday ? now : new Date(date.setHours(9, 0, 0, 0));

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No resources configured. Set up resources in agent settings.
        </p>
      </div>
    );
  }

  // Unassigned bookings
  const unassignedBookings = bookings.filter((b) => !b.resourceId);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {resources.map((resource) => {
          const { status, currentBooking, nextBooking } = getResourceStatus(
            resource.id,
            bookings,
            referenceTime
          );
          const style = STATUS_STYLES[status];
          const dayBookings = bookings.filter(
            (b) => b.resourceId === resource.id
          );

          return (
            <div
              key={resource.id}
              className={`rounded-lg border ${style.border} ${style.bg} p-3.5 transition-shadow hover:shadow-sm`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold truncate">{resource.name}</p>
                {resource.capacity > 1 && (
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ×{resource.capacity}
                  </span>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className={`text-xs font-medium ${style.text}`}>
                  {style.label}
                </span>
              </div>

              {/* Current booking info */}
              {status === "occupied" && currentBooking && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium truncate">
                    {currentBooking.callerName || currentBooking.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    til {format(parseISO(currentBooking.end), "h:mm a")}
                  </p>
                </div>
              )}

              {/* Next booking info */}
              {status === "upcoming" && nextBooking && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">Next:</p>
                  <p className="text-xs font-medium truncate">
                    {format(parseISO(nextBooking.start), "h:mm a")}{" "}
                    {nextBooking.callerName || nextBooking.title}
                  </p>
                </div>
              )}

              {/* Available — show count */}
              {status === "available" && (
                <p className="text-[10px] text-muted-foreground">
                  {dayBookings.length === 0
                    ? "No bookings"
                    : `${dayBookings.length} booking${dayBookings.length > 1 ? "s" : ""} today`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Unassigned bookings */}
      {unassignedBookings.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-yellow-400 mb-2">
            Unassigned Bookings ({unassignedBookings.length})
          </p>
          <div className="space-y-1.5">
            {unassignedBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" />
                  <p className="text-xs font-medium truncate">
                    {b.callerName || b.title}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                  {format(parseISO(b.start), "h:mm a")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
