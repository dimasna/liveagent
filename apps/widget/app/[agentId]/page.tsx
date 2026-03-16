import { VoiceWidget } from "@/components/voice-widget";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3005";

interface Props {
  params: Promise<{
    agentId: string;
  }>;
  searchParams: Promise<{
    color?: string;
    bg?: string;
    greeting?: string;
  }>;
}

async function getAgentConfig(agentId: string) {
  try {
    const res = await fetch(
      `${WEB_APP_URL}/api/agents/${agentId}/widget-config`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return res.json() as Promise<{
      name: string;
      widgetColor: string;
      widgetBgColor: string;
      widgetPosition: string;
      greeting: string;
    }>;
  } catch {
    return null;
  }
}

/**
 * Widget page rendered inside the iframe.
 * URL pattern: /{agentId}?color=#0a0a0a&bg=#0a0a0a&greeting=Hello
 *
 * Query params override saved agent config.
 */
export default async function WidgetPage({ params, searchParams }: Props) {
  const { agentId } = await params;
  const { color, bg, greeting } = await searchParams;

  const config = await getAgentConfig(agentId);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <VoiceWidget
        agentId={agentId}
        color={color || config?.widgetColor || undefined}
        bgColor={bg || config?.widgetBgColor || undefined}
        greeting={greeting || config?.greeting || undefined}
      />
    </div>
  );
}
