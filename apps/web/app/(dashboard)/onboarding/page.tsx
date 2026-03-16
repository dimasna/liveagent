"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  Loader2Icon,
} from "lucide-react";

const STEPS = [
  {
    title: "Create Your First Agent",
    description:
      "Set up a voice agent with your business name, greeting message, and voice preferences.",
    icon: PhoneIcon,
  },
  {
    title: "Connect Google Calendar",
    description:
      "Link your Google Calendar so the agent can check availability and create bookings in real-time.",
    icon: CalendarIcon,
  },
  {
    title: "Test & Go Live",
    description:
      "Use the playground to test your agent, then embed the widget on your website or connect a phone number.",
    icon: CheckCircleIcon,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleGetStarted() {
    setCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My First Agent" }),
      });
      if (res.ok) {
        const agent = await res.json();
        router.push(`/agents/${agent.id}`);
      } else {
        router.push("/workspace");
      }
    } catch {
      router.push("/workspace");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" className="mx-auto mb-4">
            <rect width="28" height="28" rx="7" fill="white" />
            <rect x="6.5" y="11" width="2" height="6" rx="1" fill="#0a0a0a" opacity="0.35" />
            <rect x="10" y="8.5" width="2" height="11" rx="1" fill="#0a0a0a" opacity="0.55" />
            <rect x="13.5" y="6" width="2" height="16" rx="1" fill="#0a0a0a" />
            <rect x="17" y="9" width="2" height="10" rx="1" fill="#0a0a0a" opacity="0.55" />
            <rect x="20.5" y="11.5" width="2" height="5" rx="1" fill="#0a0a0a" opacity="0.35" />
          </svg>
          <h1 className="text-3xl font-bold">Welcome to Liveagent.dev</h1>
          <p className="mt-2 text-muted-foreground">
            Set up your AI voice agent in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="mt-10 space-y-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex items-start gap-4 rounded-xl border border-border p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <step.icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-0.5 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleGetStarted}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-brand px-8 py-3 text-sm font-medium text-foreground-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            {creating ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightIcon className="h-4 w-4" />
            )}
            Create Your First Agent
          </button>
          <button
            onClick={() => router.push("/workspace")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
