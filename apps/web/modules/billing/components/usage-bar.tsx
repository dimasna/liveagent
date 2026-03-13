"use client";

interface UsageBarProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
}

export function UsageBar({ label, used, max, unit = "" }: UsageBarProps) {
  const percentage = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isUnlimited = max === -1;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used.toLocaleString()}
          {isUnlimited ? "" : ` / ${max.toLocaleString()}`}
          {unit && ` ${unit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              percentage > 90
                ? "bg-destructive"
                : percentage > 70
                  ? "bg-yellow-500"
                  : "bg-brand"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
