"use client";

import { useState } from "react";

/**
 * Preview/debug page for testing the widget in development.
 * Access at http://localhost:3006
 */
export default function WidgetPreviewPage() {
  const [agentId, setAgentId] = useState("test-agent-123");

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          LiveAgent Voice Widget Preview
        </h1>
        <p className="text-gray-600 mb-6">
          This page is for testing the voice widget during development.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Configuration</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent ID
          </label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Enter agent ID"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Embed Code</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-x-auto">
            {`<script
  src="${typeof window !== "undefined" ? window.location.origin : "https://widget.liveagent.com"}/widget.js"
  data-agent-id="${agentId}"
  data-position="bottom-right"
  data-color="#3b82f6"
></script>`}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Widget Preview</h2>
          <p className="text-sm text-gray-500 mb-4">
            The widget iframe is loaded below for testing:
          </p>
          <div className="relative w-[400px] h-[600px] border border-gray-200 rounded-lg overflow-hidden mx-auto">
            <iframe
              src={`/${agentId}`}
              className="w-full h-full border-none"
              allow="microphone"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
