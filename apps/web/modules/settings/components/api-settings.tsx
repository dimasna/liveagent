"use client";

import { useState } from "react";

interface ApiSettingsProps {
  agentWsUrl: string;
  widgetUrl: string;
}

export function ApiSettings({ agentWsUrl, widgetUrl }: ApiSettingsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-xl border border-border p-6">
      <h2 className="mb-4 font-semibold">API & Integration</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Agent WebSocket URL
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm">
              {agentWsUrl}/ws/:agentId/:sessionId
            </code>
            <button
              onClick={() =>
                copy(`${agentWsUrl}/ws/:agentId/:sessionId`, "ws")
              }
              className="rounded-lg bg-muted px-3 py-2 text-sm hover:bg-accent"
            >
              {copied === "ws" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Widget Embed Code
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-muted px-3 py-2 text-sm">
              {`<script src="${widgetUrl}/widget.js" data-agent-id="YOUR_AGENT_ID"></script>`}
            </code>
            <button
              onClick={() =>
                copy(
                  `<script src="${widgetUrl}/widget.js" data-agent-id="YOUR_AGENT_ID"></script>`,
                  "embed"
                )
              }
              className="rounded-lg bg-muted px-3 py-2 text-sm hover:bg-accent"
            >
              {copied === "embed" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
