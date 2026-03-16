"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@modules/auth/components/auth-provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const [agentWsUrl, setAgentWsUrl] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(c => setAgentWsUrl(c.agentWsUrl));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace settings
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Username</label>
              <p className="text-sm text-muted-foreground">
                {user?.username || "—"}
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
              {agentWsUrl || "ws://localhost:8080"}
              /ws/:agentId/:sessionId
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
