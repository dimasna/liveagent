"use client";

import { PLANS } from "@liveagent/shared";

export default function BillingPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PLANS)
          .filter(([key]) => key !== "ENTERPRISE")
          .map(([key, plan]) => (
            <div
              key={key}
              className="rounded-xl border border-border p-6 transition-colors hover:border-brand/50"
            >
              <h3 className="mb-1 font-semibold">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  ${plan.price}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  {plan.maxAgents === -1
                    ? "Unlimited"
                    : plan.maxAgents}{" "}
                  agent{plan.maxAgents !== 1 ? "s" : ""}
                </li>
                <li>
                  {plan.maxMinutesMonth === -1
                    ? "Unlimited"
                    : plan.maxMinutesMonth.toLocaleString()}{" "}
                  minutes/mo
                </li>
                <li>Google Calendar sync</li>
                <li>Call transcripts</li>
              </ul>
              <button
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium ${
                  key === "FREE"
                    ? "bg-muted text-muted-foreground"
                    : "bg-brand text-brand-foreground hover:bg-brand/90"
                }`}
              >
                {key === "FREE" ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
