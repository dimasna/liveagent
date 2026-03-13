"use client";

interface DashboardStatsProps {
  stats: {
    totalAgents: number;
    totalCalls: number;
    totalBookings: number;
    totalMinutes: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    { label: "Active Agents", value: stats.totalAgents },
    { label: "Total Calls", value: stats.totalCalls },
    { label: "Bookings Made", value: stats.totalBookings },
    { label: "Minutes Used", value: stats.totalMinutes },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
