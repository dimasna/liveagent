import { NextResponse } from "next/server";

// GET /api/config — returns runtime env vars for client components
// NEXT_PUBLIC_ vars are inlined at build time and empty in Docker builds,
// so client components fetch them here instead.
export async function GET() {
  return NextResponse.json({
    widgetUrl: process.env.NEXT_PUBLIC_WIDGET_URL || "",
    callUrl: process.env.NEXT_PUBLIC_CALL_URL || "",
    agentWsUrl: process.env.NEXT_PUBLIC_AGENT_WS_URL || "",
    appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "",
    demoAgentId: process.env.NEXT_PUBLIC_DEMO_AGENT_ID || "",
  });
}
