"use client";

import { BUSINESS_TYPES } from "@liveagent/shared";
import { VoiceSelector } from "./voice-selector";

interface AgentFormData {
  name: string;
  username: string;
  businessName: string;
  businessType: string;
  timezone: string;
  voice: string;
  greeting: string;
  instruction: string;
  bookingDuration: number;
  maxAdvanceDays: number;
}

interface AgentFormProps {
  data: AgentFormData;
  onChange: (data: AgentFormData) => void;
}

export function AgentForm({ data, onChange }: AgentFormProps) {
  const update = (field: keyof AgentFormData, value: string | number) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Basic Info */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="mb-4 font-semibold">Basic Information</h2>
        <div className="space-y-4">
          <Field label="Agent Name">
            <input
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Call Link Username">
            <div className="flex items-center gap-0">
              <span className="shrink-0 rounded-l-lg border border-r-0 border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                /
              </span>
              <input
                value={data.username}
                onChange={(e) =>
                  update(
                    "username",
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
                placeholder="joes-barbershop"
                className="w-full rounded-r-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unique URL for your call page. Only lowercase letters, numbers, and hyphens.
            </p>
          </Field>
          <Field label="Business Name">
            <input
              value={data.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Business Type">
            <select
              value={data.businessType}
              onChange={(e) => update("businessType", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Timezone">
            <input
              value={data.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="mb-4 font-semibold">Voice Settings</h2>
        <div className="space-y-4">
          <Field label="Voice">
            <VoiceSelector
              value={data.voice}
              onChange={(v) => update("voice", v)}
            />
          </Field>
          <Field label="Greeting Message">
            <textarea
              value={data.greeting}
              onChange={(e) => update("greeting", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Custom Instructions">
            <textarea
              value={data.instruction}
              onChange={(e) => update("instruction", e.target.value)}
              rows={4}
              placeholder="Additional instructions for the agent..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </div>

      {/* Booking Settings */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="mb-4 font-semibold">Booking Settings</h2>
        <div className="space-y-4">
          <Field label="Default Slot Duration (minutes)">
            <input
              type="number"
              value={data.bookingDuration}
              onChange={(e) =>
                update("bookingDuration", parseInt(e.target.value) || 60)
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Max Advance Booking (days)">
            <input
              type="number"
              value={data.maxAdvanceDays}
              onChange={(e) =>
                update("maxAdvanceDays", parseInt(e.target.value) || 30)
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
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
