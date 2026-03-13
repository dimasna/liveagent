"use client";

import { use } from "react";
import { VoiceWidget } from "@/components/voice-widget";

interface Props {
  params: Promise<{
    agentId: string;
  }>;
  searchParams: Promise<{
    color?: string;
    greeting?: string;
  }>;
}

/**
 * Widget page rendered inside the iframe.
 * URL pattern: /{agentId}?color=#3b82f6&greeting=Hello
 *
 * This page is loaded by the embed script inside an iframe.
 * It renders the full voice widget experience.
 */
export default function WidgetPage({ params, searchParams }: Props) {
  const { agentId } = use(params);
  const { color, greeting } = use(searchParams);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <VoiceWidget
        agentId={agentId}
        color={color || undefined}
        greeting={greeting || undefined}
      />
    </div>
  );
}
