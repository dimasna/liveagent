import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    agentWsUrl: process.env.NEXT_PUBLIC_AGENT_WS_URL || "",
    widgetApiUrl: process.env.NEXT_PUBLIC_WIDGET_API_URL || "",
  });
}
