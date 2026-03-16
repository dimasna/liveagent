import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";

type Params = { params: Promise<{ username: string }> };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/agents/by-username/:username
 * Public endpoint (no auth) — resolves an agent username to its public config.
 * Used by the call app to load agent info from the URL slug.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { username } = await params;

  const agent = await db.agent.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      businessName: true,
      businessType: true,
      voice: true,
      greeting: true,
      widgetColor: true,
      widgetBgColor: true,
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, {
      status: 404,
      headers: corsHeaders,
    });
  }

  return NextResponse.json(agent, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=60",
    },
  });
}
