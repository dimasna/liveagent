"use client";

interface Stats {
  totalCalls: number;
  totalBookings: number;
  recentCalls: number;
  totalMinutes: number;
  bookingRate: number;
  outcomeBreakdown: { outcome: string; count: number }[];
}

export function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Calls" value={stats.totalCalls} />
      <StatCard label="Bookings Made" value={stats.totalBookings} />
      <StatCard label="Booking Rate" value={`${stats.bookingRate}%`} />
      <StatCard label="Total Minutes" value={stats.totalMinutes} />

      <div className="col-span-full rounded-xl border border-border p-6">
        <h3 className="mb-4 font-semibold">Call Outcomes (Last 30 Days)</h3>
        {stats.outcomeBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No call data yet</p>
        ) : (
          <div className="space-y-2">
            {stats.outcomeBreakdown.map((o) => (
              <div
                key={o.outcome}
                className="flex items-center justify-between"
              >
                <span className="text-sm capitalize">
                  {o.outcome.replace(/_/g, " ").toLowerCase()}
                </span>
                <span className="text-sm font-medium">{o.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
