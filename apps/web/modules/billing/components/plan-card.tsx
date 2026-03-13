"use client";

interface PlanCardProps {
  name: string;
  price: number;
  maxAgents: number;
  maxMinutes: number;
  isCurrent: boolean;
  onUpgrade?: () => void;
}

export function PlanCard({
  name,
  price,
  maxAgents,
  maxMinutes,
  isCurrent,
  onUpgrade,
}: PlanCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 transition-colors ${
        isCurrent ? "border-brand bg-brand/5" : "border-border hover:border-brand/50"
      }`}
    >
      <h3 className="mb-1 font-semibold">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold">${price}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </div>
      <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
        <li>{maxAgents === -1 ? "Unlimited" : maxAgents} agent{maxAgents !== 1 ? "s" : ""}</li>
        <li>{maxMinutes === -1 ? "Unlimited" : maxMinutes.toLocaleString()} minutes/mo</li>
        <li>Google Calendar sync</li>
        <li>Call transcripts</li>
      </ul>
      <button
        onClick={() => onUpgrade?.()}
        disabled={isCurrent || !onUpgrade}
        className={`w-full rounded-lg px-4 py-2 text-sm font-medium ${
          isCurrent
            ? "bg-muted text-muted-foreground"
            : "bg-brand text-brand-foreground hover:bg-brand/90"
        }`}
      >
        {isCurrent ? "Current Plan" : "Upgrade"}
      </button>
    </div>
  );
}
