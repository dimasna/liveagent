import { CallScreen } from "@/components/call-screen";
import { notFound } from "next/navigation";

const WEB_APP_URL =
  process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3005";

interface AgentConfig {
  id: string;
  name: string;
  businessName: string;
  businessType: string;
  voice: string;
  greeting: string;
  widgetColor: string;
  widgetBgColor: string;
}

async function getAgentByUsername(
  username: string
): Promise<AgentConfig | null> {
  try {
    const res = await fetch(
      `${WEB_APP_URL}/api/agents/by-username/${encodeURIComponent(username)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ username: string }>;
}

export default async function CallPage({ params }: Props) {
  const { username } = await params;
  const agent = await getAgentByUsername(username);

  if (!agent) {
    notFound();
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <CallScreen
        agentId={agent.id}
        agentName={agent.name}
        businessName={agent.businessName}
        voice={agent.voice}
      />
    </div>
  );
}
