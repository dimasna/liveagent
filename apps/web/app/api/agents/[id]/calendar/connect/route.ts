import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getErrorStatus } from "@lib/auth";
import { db } from "@liveagent/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/agents/:id/calendar/connect — Generate Google OAuth URL
// Server-side so we don't leak client_id to the frontend
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    // Verify agent belongs to org
    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID." },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "";
    // Use a fixed callback path so only ONE redirect URI needs to be
    // registered in Google Cloud Console. The agent ID is passed via state.
    const redirectUri = `${appUrl}/api/calendar/callback`;

    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const authUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    // Pass agent ID through state for verification
    authUrl.searchParams.set("state", id);

    return NextResponse.json({ url: authUrl.toString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
