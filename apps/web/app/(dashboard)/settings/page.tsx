"use client";

import { useOrganization } from "@clerk/nextjs";

export default function SettingsPage() {
  const { organization } = useOrganization();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization settings
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Organization</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">
                {organization?.name || "—"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ID</label>
              <p className="font-mono text-sm text-muted-foreground">
                {organization?.id || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">API Access</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Use the API to programmatically manage agents and access
            conversation data.
          </p>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              Agent WebSocket endpoint:
            </p>
            <code className="text-sm">
              {process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8080"}
              /ws/:agentId/:sessionId
            </code>
          </div>
        </div>

        <div className="rounded-xl border border-destructive/50 p-6">
          <h2 className="mb-2 font-semibold text-destructive">Danger Zone</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Permanently delete your organization and all associated data.
          </p>
          <button className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
            Delete Organization
          </button>
        </div>
      </div>
    </div>
  );
}
