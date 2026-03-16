"use client";

import { useEffect, useState } from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<{ widgetUrl: string; demoAgentId: string } | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => setConfig({ widgetUrl: c.widgetUrl, demoAgentId: c.demoAgentId }));
  }, []);

  useEffect(() => {
    if (!config?.widgetUrl || !config?.demoAgentId) return;

    const script = document.createElement("script");
    script.src = `${config.widgetUrl}/widget.js`;
    script.async = true;
    script.setAttribute("data-agent-id", config.demoAgentId);
    script.setAttribute("data-api-url", window.location.origin);
    document.body.appendChild(script);

    return () => {
      script.remove();
      (window as any).LiveAgentWidget?.destroy();
    };
  }, [config]);

  return <>{children}</>;
}
