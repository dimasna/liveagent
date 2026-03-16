"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BUSINESS_TYPES,
  DEFAULT_OPERATING_HOURS,
  getCalendarTemplate,
  getResourceTypeConfig,
  resolveTemplate,
} from "@liveagent/shared";
import { VoiceSelector } from "./voice-selector";
import {
  Loader2Icon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CalendarIcon,
  XIcon,
  ClockIcon,
  SparklesIcon,
  SearchIcon,
  BrainIcon,
  DollarSignIcon,
  MessageSquareIcon,
  BuildingIcon,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  calendarId: string | null;
  [key: string]: unknown;
}

interface FormData {
  name: string;
  businessType: string;
  businessName: string;
  address: string;
  phone: string;
  timezone: string;
  operatingHours: Record<string, { open: string; close: string } | null>;
  voice: string;
  greeting: string;
  instruction: string;
  bookingDuration: number;
  maxAdvanceDays: number;
  pricing: string;
  capacityType: string;
  capacityCount: number;
  capacityLabel: string;
}

const CAPACITY_TYPE_LABELS: Record<string, string> = {
  tables: "Tables",
  rooms: "Rooms",
  chairs: "Chairs",
  courts: "Courts",
  slots: "Slots",
  units: "Units",
};

const INITIAL_FORM: FormData = {
  name: "",
  businessType: "restaurant",
  businessName: "",
  address: "",
  phone: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  operatingHours: { ...DEFAULT_OPERATING_HOURS },
  voice: "Puck",
  greeting: "Hello! How can I help you with your reservation today?",
  instruction: "",
  bookingDuration: 60,
  maxAdvanceDays: 30,
  pricing: "",
  capacityType: "slots",
  capacityCount: 0,
  capacityLabel: "",
};

const DAY_LABELS: { key: string; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

interface ResearchTask {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "searching" | "done";
  message: string;
}

const INITIAL_TASKS: ResearchTask[] = [
  {
    id: "places",
    label: "Google Places",
    icon: <SearchIcon className="h-4 w-4" />,
    status: "pending",
    message: "Looking up your business...",
  },
  {
    id: "analyze",
    label: "Business Analysis",
    icon: <BuildingIcon className="h-4 w-4" />,
    status: "pending",
    message: "Analyzing business type...",
  },
  {
    id: "details",
    label: "Pricing & Capacity",
    icon: <DollarSignIcon className="h-4 w-4" />,
    status: "pending",
    message: "Researching details...",
  },
  {
    id: "prompt",
    label: "Brand Voice",
    icon: <MessageSquareIcon className="h-4 w-4" />,
    status: "pending",
    message: "Crafting personality...",
  },
];

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (agent: Agent) => void;
}

export function CreateAgentModal({
  open,
  onOpenChange,
  onCreated,
}: CreateAgentModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [creating, setCreating] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);

  // Step 1 inputs
  const [businessInput, setBusinessInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");

  // Step 2 research state
  const [tasks, setTasks] = useState<ResearchTask[]>([...INITIAL_TASKS]);
  const [researching, setResearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Calendar state — workspace-level Google integration
  const [calendarPhase, setCalendarPhase] = useState<
    "checking" | "creating" | "done" | "no-workspace"
  >("checking");
  const [resourcesCreated, setResourcesCreated] = useState(false);
  const [workspaceEmail, setWorkspaceEmail] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({ ...INITIAL_FORM });
      setCreatedAgent(null);
      setBusinessInput("");
      setWebsiteInput("");
      setTasks(INITIAL_TASKS.map((t) => ({ ...t })));
      setResearching(false);
      setCalendarPhase("checking");
      setResourcesCreated(false);
      setWorkspaceEmail(null);
      setCalendarError(null);
    } else {
      abortRef.current?.abort();
    }
  }, [open]);

  function updateForm(updates: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  // --- Step 2: AI Research via SSE ---
  const startResearch = useCallback(async () => {
    setStep(2);
    setResearching(true);
    setTasks(INITIAL_TASKS.map((t) => ({ ...t })));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/agents/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessInput,
          website: websiteInput || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setResearching(false);
        setForm((prev) => ({ ...prev, name: businessInput }));
        setStep(3);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);

              if (eventType === "step") {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === data.task
                      ? { ...t, status: data.status, message: data.message }
                      : t
                  )
                );
              } else if (eventType === "complete") {
                completed = true;
                // Apply research results to form
                setForm((prev) => ({
                  ...prev,
                  name: businessInput,
                  businessName: data.businessName || businessInput,
                  businessType: data.businessType || prev.businessType,
                  address: data.address || prev.address,
                  phone: data.phone || prev.phone,
                  timezone: data.timezone || prev.timezone,
                  operatingHours: data.operatingHours || prev.operatingHours,
                  voice: data.voice || prev.voice,
                  greeting: data.greeting || prev.greeting,
                  instruction: data.instruction || prev.instruction,
                  bookingDuration: data.bookingDuration || prev.bookingDuration,
                  maxAdvanceDays: data.maxAdvanceDays || prev.maxAdvanceDays,
                  pricing: data.pricing || "",
                  capacityType: data.capacityType || prev.capacityType,
                  capacityCount: data.capacityCount || prev.capacityCount,
                  capacityLabel: data.capacityLabel || "",
                }));

                // Brief delay to show all checkmarks before advancing
                setTimeout(() => {
                  setResearching(false);
                  setStep(3);
                }, 800);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      // If stream ended without complete event, advance anyway
      if (!completed) {
        setResearching(false);
        setForm((prev) => ({ ...prev, name: businessInput }));
        setStep(3);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResearching(false);
        setForm((prev) => ({ ...prev, name: businessInput }));
        setStep(3);
      }
    }
  }, [businessInput, websiteInput]);

  // --- Step 3: Create agent + auto-create calendar ---
  async function createAgent() {
    setCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          businessName: form.businessName || form.name,
          businessType: form.businessType,
          timezone: form.timezone,
          voice: form.voice,
          greeting: form.greeting,
          instruction: form.instruction,
          operatingHours: form.operatingHours,
          bookingDuration: form.bookingDuration,
          maxAdvanceDays: form.maxAdvanceDays,
          capacityType: form.capacityType,
          capacityCount: form.capacityCount,
        }),
      });

      if (!res.ok) return;
      const agent = await res.json();
      setCreatedAgent(agent);
      setStep(4);

      // Auto-generate resources based on capacity info
      if (form.capacityCount > 0) {
        try {
          const genRes = await fetch(
            `/api/agents/${agent.id}/resources/generate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                businessType: form.businessType,
                count: form.capacityCount,
              }),
            }
          );
          if (genRes.ok) {
            setResourcesCreated(true);
          }
        } catch {
          // Non-critical — user can add resources later
        }
      }

      // Check workspace Google Calendar connection & auto-create
      await autoCreateCalendar(agent);
    } finally {
      setCreating(false);
    }
  }

  // --- Auto-create Google Calendar using workspace tokens ---
  async function autoCreateCalendar(agent: Agent) {
    setCalendarPhase("checking");
    setCalendarError(null);

    try {
      // 1. Check if workspace has Google connected
      const statusRes = await fetch("/api/workspace/calendar");
      if (!statusRes.ok) {
        setCalendarPhase("no-workspace");
        return;
      }
      const status = await statusRes.json();

      if (!status.connected) {
        setCalendarPhase("no-workspace");
        return;
      }

      setWorkspaceEmail(status.email);
      setCalendarPhase("creating");

      // 2. Auto-create a Google Calendar from business type template
      const createRes = await fetch(
        `/api/agents/${agent.id}/calendar/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: form.businessType,
            businessName: form.businessName || form.name,
            timezone: form.timezone,
          }),
        }
      );

      if (createRes.ok) {
        const data = await createRes.json();
        setCreatedAgent({ ...agent, calendarId: data.calendarId });
        setCalendarPhase("done");
      } else {
        const err = await createRes.json().catch(() => null);
        setCalendarError(err?.error || "Failed to create calendar");
        setCalendarPhase("no-workspace");
      }
    } catch {
      setCalendarError("Failed to connect to Google Calendar");
      setCalendarPhase("no-workspace");
    }
  }

  // --- Connect workspace Google account via popup ---
  function connectWorkspaceGoogle() {
    const popup = window.open(
      "/api/workspace/calendar/connect",
      "workspace-google-connect",
      "width=600,height=700,left=200,top=100"
    );

    const interval = setInterval(async () => {
      if (popup?.closed) {
        clearInterval(interval);
        // Re-check workspace connection and auto-create calendar
        if (createdAgent) {
          await autoCreateCalendar(createdAgent);
        }
      }
    }, 500);
  }

  function finish() {
    if (createdAgent) {
      onCreated(createdAgent);
    }
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in-0"
        onClick={() => !researching && onOpenChange(false)}
      />
      {/* Modal */}
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border border-border bg-background shadow-lg animate-in fade-in-0 zoom-in-95 mx-4">
        {/* Close button */}
        {!researching && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity z-10"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}

        {/* === STEP 1: Business Input (minimal) === */}
        {step === 1 && (
          <div className="flex flex-col items-center px-8 py-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground">
              <SparklesIcon className="h-7 w-7 text-background" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight mb-1">
              Create Your Voice Agent
            </h2>
            <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
              Just tell us your business name and we&apos;ll use AI to set
              everything up for you
            </p>

            <div className="w-full max-w-md space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Business Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={businessInput}
                  onChange={(e) => setBusinessInput(e.target.value)}
                  placeholder="e.g. Joe's Pizza, Zen Spa, City Dental"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && businessInput.trim()) {
                      startResearch();
                    }
                  }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Website
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (optional — helps AI find more details)
                  </span>
                </label>
                <input
                  value={websiteInput}
                  onChange={(e) => setWebsiteInput(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && businessInput.trim()) {
                      startResearch();
                    }
                  }}
                />
              </div>

              <button
                onClick={startResearch}
                disabled={!businessInput.trim()}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
              >
                <SparklesIcon className="h-4 w-4" />
                Set Up My Agent
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Our AI will research your business and auto-configure your voice
                agent
              </p>
            </div>
          </div>
        )}

        {/* === STEP 2: AI Researching (animated) === */}
        {step === 2 && (
          <div className="flex flex-col items-center px-8 py-10">
            {/* Animated spinner */}
            <div className="relative mb-8">
              <div className="h-20 w-20 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-transparent border-t-foreground animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainIcon className="h-8 w-8 text-foreground" />
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-1">
              Setting up your agent
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Researching &quot;{businessInput}&quot;...
            </p>

            {/* Task list */}
            <div className="w-full max-w-sm space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-500 ${
                    task.status === "done"
                      ? "border-green-500/20 bg-green-500/10"
                      : task.status === "searching"
                        ? "border-foreground/20 bg-foreground/5"
                        : "border-border bg-muted/30"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                      task.status === "done"
                        ? "bg-green-500/10 text-green-400"
                        : task.status === "searching"
                          ? "bg-foreground/10 text-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {task.status === "done" ? (
                      <CheckCircle2Icon className="h-4 w-4" />
                    ) : task.status === "searching" ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      task.icon
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium transition-colors duration-500 ${
                        task.status === "done"
                          ? "text-green-400"
                          : task.status === "searching"
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {task.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.message}
                    </p>
                  </div>

                  {/* Status dot */}
                  {task.status === "done" && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-green-500 animate-in fade-in-0 zoom-in-50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === STEP 3: Review & Create === */}
        {step === 3 && !createdAgent && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Review & Create
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                AI-researched settings — edit anything before creating
              </p>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Business Info */}
              <section>
                <h3 className="text-sm font-semibold mb-3">Business Info</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Agent Name
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => updateForm({ name: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Business Type
                      </label>
                      <select
                        value={form.businessType}
                        onChange={(e) =>
                          updateForm({ businessType: e.target.value })
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        {BUSINESS_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Business Name
                      </label>
                      <input
                        value={form.businessName}
                        onChange={(e) =>
                          updateForm({ businessName: e.target.value })
                        }
                        placeholder={form.name}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Phone
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) => updateForm({ phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          !form.phone
                            ? "border-amber-500/20 bg-amber-500/10"
                            : "border-input bg-background"
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Address
                    </label>
                    <input
                      value={form.address}
                      onChange={(e) => updateForm({ address: e.target.value })}
                      placeholder="123 Main St, City, State"
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        !form.address
                          ? "border-amber-500/20 bg-amber-500/10"
                          : "border-input bg-background"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Timezone
                    </label>
                    <input
                      value={form.timezone}
                      onChange={(e) =>
                        updateForm({ timezone: e.target.value })
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Capacity & Pricing */}
              <section>
                <h3 className="text-sm font-semibold mb-3">
                  Capacity & Pricing
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Capacity Type
                    </label>
                    <select
                      value={form.capacityType}
                      onChange={(e) =>
                        updateForm({ capacityType: e.target.value })
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(CAPACITY_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Total {CAPACITY_TYPE_LABELS[form.capacityType] || "Units"}
                    </label>
                    <input
                      type="number"
                      value={form.capacityCount || ""}
                      onChange={(e) =>
                        updateForm({ capacityCount: parseInt(e.target.value) || 0 })
                      }
                      placeholder="e.g. 20"
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        !form.capacityCount
                          ? "border-amber-500/20 bg-amber-500/10"
                          : "border-input bg-background"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Pricing
                    </label>
                    <input
                      value={form.pricing}
                      onChange={(e) =>
                        updateForm({ pricing: e.target.value })
                      }
                      placeholder="e.g. $15-30 per person"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {form.capacityLabel && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    AI estimate: {form.capacityLabel}
                  </p>
                )}
              </section>

              {/* Operating Hours */}
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Operating Hours
                </h3>
                <div className="space-y-2">
                  {DAY_LABELS.map(({ key, label }) => {
                    const dayHours = form.operatingHours[key];
                    const isOpen = dayHours !== null;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                      >
                        <span className="w-12 text-sm font-medium">
                          {label}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newHours = { ...form.operatingHours };
                            newHours[key] = isOpen
                              ? null
                              : { open: "09:00", close: "17:00" };
                            updateForm({ operatingHours: newHours });
                          }}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isOpen
                              ? "bg-green-500/10 text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isOpen ? "Open" : "Closed"}
                        </button>
                        {isOpen && (
                          <div className="flex items-center gap-2 ml-auto">
                            <input
                              type="time"
                              value={dayHours.open}
                              onChange={(e) => {
                                const newHours = { ...form.operatingHours };
                                newHours[key] = {
                                  ...dayHours,
                                  open: e.target.value,
                                };
                                updateForm({ operatingHours: newHours });
                              }}
                              className="rounded border border-input bg-background px-2 py-1 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">
                              to
                            </span>
                            <input
                              type="time"
                              value={dayHours.close}
                              onChange={(e) => {
                                const newHours = { ...form.operatingHours };
                                newHours[key] = {
                                  ...dayHours,
                                  close: e.target.value,
                                };
                                updateForm({ operatingHours: newHours });
                              }}
                              className="rounded border border-input bg-background px-2 py-1 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Voice & Brand */}
              <section>
                <h3 className="text-sm font-semibold mb-3">Voice & Brand</h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Voice
                    </label>
                    <VoiceSelector
                      value={form.voice}
                      onChange={(v) => updateForm({ voice: v })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Greeting Message
                    </label>
                    <textarea
                      value={form.greeting}
                      onChange={(e) =>
                        updateForm({ greeting: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Agent Instructions
                      <span className="ml-1 text-xs font-normal text-muted-foreground/70">
                        (AI-generated brand voice & knowledge)
                      </span>
                    </label>
                    <textarea
                      value={form.instruction}
                      onChange={(e) =>
                        updateForm({ instruction: e.target.value })
                      }
                      rows={6}
                      placeholder="Custom instructions for your voice agent..."
                      className={`w-full rounded-lg border px-3 py-2 text-sm resize-y font-mono text-xs leading-relaxed ${
                        !form.instruction
                          ? "border-amber-500/20 bg-amber-500/10"
                          : "border-input bg-background"
                      }`}
                    />
                  </div>
                </div>
              </section>

              {/* Booking Settings */}
              <section>
                <h3 className="text-sm font-semibold mb-3">
                  Booking Settings
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Slot Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={form.bookingDuration}
                      onChange={(e) =>
                        updateForm({
                          bookingDuration: parseInt(e.target.value) || 60,
                        })
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Max Advance (days)
                    </label>
                    <input
                      type="number"
                      value={form.maxAdvanceDays}
                      onChange={(e) =>
                        updateForm({
                          maxAdvanceDays: parseInt(e.target.value) || 30,
                        })
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={createAgent}
                disabled={creating || !form.name.trim()}
                className="flex items-center gap-2 rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {creating && <Loader2Icon className="h-4 w-4 animate-spin" />}
                Create Agent
              </button>
            </div>
          </>
        )}

        {/* === Step 4: Success + Resources + Auto Calendar === */}
        {step === 4 && createdAgent && (
          <div className="px-8 py-10">
            {/* Success header */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2Icon className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">Agent Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                &quot;{createdAgent.name}&quot; is ready to go
              </p>
            </div>

            {/* Resources created badge */}
            {resourcesCreated && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 mb-4">
                <CheckCircle2Icon className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-400">
                  Created {form.capacityCount}{" "}
                  {getResourceTypeConfig(form.businessType).label.toLowerCase()}
                  {form.capacityCount !== 1 ? "s" : ""} for booking management
                </p>
              </div>
            )}

            {/* Calendar section */}
            <div className="rounded-xl border border-border p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <CalendarIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">
                    {calendarPhase === "done"
                      ? "Booking calendar created automatically"
                      : calendarPhase === "creating"
                        ? "Setting up your booking calendar..."
                        : calendarPhase === "checking"
                          ? "Checking workspace connection..."
                          : "Connect Google to enable calendar booking"}
                  </p>
                </div>
                {calendarPhase === "done" && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-400">
                      Connected
                    </span>
                  </div>
                )}
              </div>

              {/* Phase: checking — spinner */}
              {calendarPhase === "checking" && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Checking Google Calendar connection...
                  </p>
                </div>
              )}

              {/* Phase: creating — spinner */}
              {calendarPhase === "creating" && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2Icon className="h-4 w-4 animate-spin text-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Creating &quot;{resolveTemplate(
                      getCalendarTemplate(form.businessType).summaryTemplate,
                      { businessName: form.businessName || form.name || "My Business" }
                    )}&quot;...
                  </p>
                </div>
              )}

              {/* Phase: done — success */}
              {calendarPhase === "done" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-3">
                    <CheckCircle2Icon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-400">
                        {resolveTemplate(
                          getCalendarTemplate(form.businessType).summaryTemplate,
                          { businessName: form.businessName || form.name || "My Business" }
                        )}
                      </p>
                      {workspaceEmail && (
                        <p className="text-xs text-green-400/70">
                          via {workspaceEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Phase: no-workspace — prompt to connect Google */}
              {calendarPhase === "no-workspace" && (
                <div className="space-y-3">
                  {calendarError && (
                    <p className="text-xs text-amber-400">
                      {calendarError}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Connect your Google account at the workspace level to
                    automatically create booking calendars for your agents.
                  </p>
                  <button
                    onClick={connectWorkspaceGoogle}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Connect Google Account
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={finish}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {calendarPhase === "done" ? "" : "Skip for now"}
              </button>
              <button
                onClick={finish}
                className="flex items-center gap-2 rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Go to Agent
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
