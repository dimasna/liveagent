"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BUSINESS_TYPES } from "@liveagent/shared";
import { VoiceSelector } from "@modules/agents/components/voice-selector";
import {
  Loader2Icon,
  CopyIcon,
  CheckIcon,
  CodeIcon,
  GlobeIcon,
  TrashIcon,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  businessName: string;
  businessType: string;
  timezone: string;
  voice: string;
  greeting: string;
  instruction: string;
  calendarId: string | null;
  bookingDuration: number;
  maxAdvanceDays: number;
  widgetColor: string;
  widgetBgColor: string;
  widgetPosition: string;
  status: string;
}

interface WidgetConfig {
  themeColor: string;
  bgColor: string;
  position: "bottom-right" | "bottom-left";
  greeting: string;
  buttonSize: "small" | "medium" | "large";
}

const DEFAULT_CONFIG: WidgetConfig = {
  themeColor: "#0a0a0a",
  bgColor: "#0a0a0a",
  position: "bottom-right",
  greeting: "",
  buttonSize: "medium",
};

type Tab = "settings" | "widget" | "deploy";

export default function PlaygroundPage() {
  const searchParams = useSearchParams();
  const agentIdFromUrl = searchParams.get("agentId");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("settings");

  // Widget config
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);

  // Deploy
  const [copied, setCopied] = useState(false);

  // Load agents
  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAgents(data);
          if (agentIdFromUrl && data.some((a: Agent) => a.id === agentIdFromUrl)) {
            setSelectedAgentId(agentIdFromUrl);
          } else if (data.length > 0) {
            setSelectedAgentId(data[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [agentIdFromUrl]);

  // Load selected agent
  useEffect(() => {
    if (!selectedAgentId) return;
    fetch(`/api/agents/${selectedAgentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAgent(data);
          setConfig((prev) => ({
            ...prev,
            themeColor: data.widgetColor || prev.themeColor,
            bgColor: data.widgetBgColor || prev.bgColor,
            position: data.widgetPosition || prev.position,
            greeting: data.greeting || prev.greeting,
          }));
        }
      });
  }, [selectedAgentId]);

  async function saveAgent() {
    if (!agent || !selectedAgentId) return;
    setSaving(true);
    try {
      const body = tab === "widget"
        ? {
            ...agent,
            greeting: config.greeting,
            widgetColor: config.themeColor,
            widgetBgColor: config.bgColor,
            widgetPosition: config.position,
          }
        : agent;
      const res = await fetch(`/api/agents/${selectedAgentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setAgent(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteAgent() {
    if (!selectedAgentId) return;
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      const res = await fetch(`/api/agents/${selectedAgentId}`, { method: "DELETE" });
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== selectedAgentId));
        const remaining = agents.filter((a) => a.id !== selectedAgentId);
        if (remaining.length > 0) {
          setSelectedAgentId(remaining[0].id);
        } else {
          setSelectedAgentId(null);
          setAgent(null);
        }
      }
    } catch {
      // silently fail
    }
  }

  const widgetUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/widget.js`
      : "https://yourdomain.com/widget.js";

  const embedCode = selectedAgentId
    ? `<script\n  src="${widgetUrl}"\n  data-agent-id="${selectedAgentId}"${config.themeColor !== "#0a0a0a" ? `\n  data-color="${config.themeColor}"` : ""}${config.position !== "bottom-right" ? `\n  data-position="${config.position}"` : ""}\n  async\n></script>`
    : "";

  function copyCode() {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "settings", label: "Settings" },
    { key: "widget", label: "Widget" },
    { key: "deploy", label: "Deploy" },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Panel — Tabs */}
      <div className="flex w-[55%] flex-col border-r border-border min-h-0">
        {/* Header with agent selector */}
        <div className="border-b border-border px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Playground</h1>
            <p className="text-sm text-muted-foreground">
              Configure, customize, and deploy your voice agent
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-border px-6 pt-2">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* === SETTINGS TAB === */}
          {tab === "settings" && agent && (
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="rounded-xl border border-border p-5">
                <h2 className="mb-4 font-semibold">Basic Information</h2>
                <div className="space-y-4">
                  <Field label="Agent Name">
                    <input
                      value={agent.name}
                      onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                  <Field label="Business Name">
                    <input
                      value={agent.businessName}
                      onChange={(e) => setAgent({ ...agent, businessName: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Business Type">
                      <select
                        value={agent.businessType}
                        onChange={(e) => setAgent({ ...agent, businessType: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        {BUSINESS_TYPES.map((t) => (
                          <option key={t} value={t}>{t.replace("_", " ")}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Timezone">
                      <input
                        value={agent.timezone}
                        onChange={(e) => setAgent({ ...agent, timezone: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Voice Settings */}
              <div className="rounded-xl border border-border p-5">
                <h2 className="mb-4 font-semibold">Voice & Behavior</h2>
                <div className="space-y-4">
                  <Field label="Voice">
                    <VoiceSelector
                      value={agent.voice}
                      onChange={(v) => setAgent({ ...agent, voice: v })}
                    />
                  </Field>
                  <Field label="Greeting Message">
                    <textarea
                      value={agent.greeting}
                      onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
                    />
                  </Field>
                  <Field label="Custom Instructions">
                    <textarea
                      value={agent.instruction}
                      onChange={(e) => setAgent({ ...agent, instruction: e.target.value })}
                      rows={6}
                      placeholder="You are a helpful voice agent for..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-y"
                    />
                  </Field>
                </div>
              </div>

              {/* Booking Settings */}
              <div className="rounded-xl border border-border p-5">
                <h2 className="mb-4 font-semibold">Booking Settings</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Slot Duration (min)">
                    <input
                      type="number"
                      value={agent.bookingDuration}
                      onChange={(e) =>
                        setAgent({ ...agent, bookingDuration: parseInt(e.target.value) || 60 })
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                  <Field label="Max Advance (days)">
                    <input
                      type="number"
                      value={agent.maxAdvanceDays}
                      onChange={(e) =>
                        setAgent({ ...agent, maxAdvanceDays: parseInt(e.target.value) || 30 })
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={deleteAgent}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Delete Agent
                </button>
                <button
                  onClick={saveAgent}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
                >
                  {saving && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* === WIDGET TAB === */}
          {tab === "widget" && (
            <div className="p-6 space-y-6">
              {/* Theme Color */}
              <div>
                <label className="mb-1 block text-sm font-medium">Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.themeColor}
                    onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-input"
                  />
                  <input
                    value={config.themeColor}
                    onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                    className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => setConfig({ ...config, themeColor: DEFAULT_CONFIG.themeColor })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Background Mode */}
              <div>
                <label className="mb-1 block text-sm font-medium">Widget Background</label>
                <div className="flex gap-2">
                  {([
                    { value: "#0a0a0a", label: "Dark" },
                    { value: "#ffffff", label: "Light" },
                  ] as const).map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setConfig({ ...config, bgColor: mode.value })}
                      className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        config.bgColor === mode.value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: mode.value }}
                      />
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Greeting */}
              <div>
                <label className="mb-1 block text-sm font-medium">Greeting Message</label>
                <p className="mb-1 text-xs text-muted-foreground">
                  Shown when a visitor opens the widget
                </p>
                <textarea
                  value={config.greeting}
                  onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                  rows={3}
                  placeholder="Hello! Thanks for calling. How can I help you today?"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
                />
              </div>

              {/* Button Size */}
              <div>
                <label className="mb-1 block text-sm font-medium">Button Size</label>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setConfig({ ...config, buttonSize: size })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                        config.buttonSize === size
                          ? "bg-brand text-brand-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="mb-1 block text-sm font-medium">Widget Position</label>
                <div className="flex gap-2">
                  {(["bottom-right", "bottom-left"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setConfig({ ...config, position: pos })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        config.position === pos
                          ? "bg-brand text-brand-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {pos === "bottom-right" ? "Bottom Right" : "Bottom Left"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={saveAgent}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
                >
                  {saving && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* === DEPLOY TAB === */}
          {tab === "deploy" && (
            <div className="p-6 space-y-6">
              {/* Embed Code */}
              <div className="rounded-xl border border-border">
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <CodeIcon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Website Embed</p>
                    <p className="text-xs text-muted-foreground">
                      Add a voice call widget to any website
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Paste this before the closing{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      &lt;/body&gt;
                    </code>{" "}
                    tag.
                  </p>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-300 font-mono leading-relaxed">
                      {embedCode}
                    </pre>
                    <button
                      onClick={copyCode}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      {copied ? (
                        <CheckIcon className="h-4 w-4 text-green-400" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <GlobeIcon className="h-5 w-5 text-foreground" />
                  </div>
                  <p className="font-medium">How it works</p>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">1</span>
                    <span>Add the embed code to your website. The widget loads asynchronously.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">2</span>
                    <span>A floating phone button appears. Visitors click to start a voice call.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">3</span>
                    <span>Your AI agent handles the call — answers questions, checks availability, books appointments.</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Embedded Widget Preview */}
      <div className="flex w-[45%] flex-col bg-muted/50">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Live Preview</p>
            <p className="text-xs text-muted-foreground">
              Click the button to open the widget — just like your visitors will
            </p>
          </div>
          {selectedAgentId && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          )}
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* Simulated website background */}
          <div className="p-8 space-y-4">
            <div className="h-5 w-52 rounded bg-muted-foreground/8" />
            <div className="h-3 w-80 rounded bg-muted-foreground/5" />
            <div className="h-3 w-72 rounded bg-muted-foreground/5" />
            <div className="h-36 w-full rounded-xl bg-muted-foreground/3 border border-border/50 mt-2" />
            <div className="h-3 w-64 rounded bg-muted-foreground/5" />
            <div className="h-3 w-48 rounded bg-muted-foreground/5" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-20 rounded-lg bg-muted-foreground/3 border border-border/50" />
              <div className="h-20 rounded-lg bg-muted-foreground/3 border border-border/50" />
            </div>
            <div className="h-3 w-56 rounded bg-muted-foreground/5" />
          </div>

          {selectedAgentId && (
            <WidgetEmbed
              agentId={selectedAgentId}
              agentName={agent?.name || "Agent"}
              color={config.themeColor}
              bgColor={config.bgColor}
              greeting={tab === "settings" ? (agent?.greeting || "") : (config.greeting || agent?.greeting || "")}
              position={config.position}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

/**
 * Simulates the real embed widget: FAB button + popup panel with iframe.
 * Matches the behavior of embed/widget.ts exactly.
 */
function WidgetEmbed({
  agentId,
  agentName,
  color,
  bgColor,
  greeting,
  position,
}: {
  agentId: string;
  agentName: string;
  color: string;
  bgColor: string;
  greeting: string;
  position: "bottom-right" | "bottom-left";
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [panelHeight, setPanelHeight] = useState(520);
  const posStyle = position === "bottom-right" ? "right-5" : "left-5";

  const [widgetUrl, setWidgetUrl] = useState("");
  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(c => setWidgetUrl(c.widgetUrl));
  }, []);
  const params = new URLSearchParams();
  params.set("color", color);
  params.set("bg", bgColor);
  if (greeting) params.set("greeting", greeting);
  const iframeSrc = `${widgetUrl}/${agentId}?${params.toString()}`;

  // Listen for postMessage events from the widget iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      try {
        if (event.origin !== new URL(widgetUrl).origin) return;
      } catch {
        return;
      }
      const { type, payload } = event.data || {};
      switch (type) {
        case "liveagent:close":
          setIsOpen(false);
          break;
        case "liveagent:resize":
          if (payload?.height) {
            setPanelHeight(Math.min(payload.height, 600));
          }
          break;
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [widgetUrl]);

  return (
    <>
      {/* Widget panel */}
      <div
        className={`absolute ${posStyle} bottom-[88px] w-[360px] max-h-[calc(100%-100px)] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-3 scale-[0.96] pointer-events-none"
        }`}
        style={{ zIndex: 10, height: panelHeight }}
      >
        <iframe
          key={`${agentId}-${color}-${bgColor}-${greeting}`}
          src={iframeSrc}
          className="w-full h-full border-none"
          style={{ backgroundColor: bgColor }}
          allow="microphone; clipboard-write"
        />
      </div>

      {/* Tray button */}
      {isOpen ? (
        <button
          onClick={() => setIsOpen(false)}
          className={`absolute ${posStyle} bottom-5 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95`}
          style={{ backgroundColor: "#6b7280", zIndex: 11 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`absolute ${posStyle} bottom-5 flex items-center gap-2.5 h-12 pl-2.5 pr-5 rounded-full shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-95`}
          style={{
            backgroundColor: "#f5f5f4",
            border: "1px solid rgba(0,0,0,0.06)",
            zIndex: 11,
          }}
        >
          {/* Wave icon */}
          <svg width="22" height="22" viewBox="0 0 28 28" className="shrink-0">
            <rect x="6.5" y="11" width="2.5" height="6" rx="1.25" fill="#0a0a0a" opacity="0.35"/>
            <rect x="10.5" y="8.5" width="2.5" height="11" rx="1.25" fill="#0a0a0a" opacity="0.55"/>
            <rect x="14.5" y="6" width="2.5" height="16" rx="1.25" fill="#0a0a0a"/>
            <rect x="18.5" y="9" width="2.5" height="10" rx="1.25" fill="#0a0a0a" opacity="0.55"/>
            <rect x="22.5" y="11.5" width="2.5" height="5" rx="1.25" fill="#0a0a0a" opacity="0.35"/>
          </svg>
          <span className="text-sm font-medium text-[#1a1a1a] whitespace-nowrap">
            {agentName}
          </span>
        </button>
      )}
    </>
  );
}
