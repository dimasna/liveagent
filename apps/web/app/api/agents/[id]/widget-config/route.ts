import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";

type Params = { params: Promise<{ id: string }> };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/agents/:id/widget-config
 * Public endpoint (no auth) — returns only widget display settings.
 * Used by the embed script to fetch saved customisation.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const agent = await db.agent.findUnique({
    where: { id },
    select: {
      name: true,
      widgetColor: true,
      widgetBgColor: true,
      widgetPosition: true,
      greeting: true,
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(agent, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=60",
    },
  });
}
