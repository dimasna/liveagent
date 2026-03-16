import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser } from "@lib/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// GET /api/workspace/calendar/callback — OAuth2 callback for workspace Google Calendar
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  // Helper: return an HTML page that auto-closes the popup
  function closePopupResponse(success: boolean, message?: string) {
    const html = `<!DOCTYPE html><html><head><title>Google Calendar</title></head><body>
      <p>${success ? "Connected! This window will close..." : `Error: ${message || "Unknown error"}`}</p>
      <script>window.close();</script>
    </body></html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (error) {
    return closePopupResponse(false, error);
  }

  if (!code) {
    return closePopupResponse(false, "Missing authorization code");
  }

  try {
    const { orgId } = await getAuthUser();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return closePopupResponse(false, "Google OAuth is not configured");
    }

    const redirectUri = `${appUrl}/api/workspace/calendar/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("Google token exchange error:", errorBody);
      return closePopupResponse(false, "Failed to exchange authorization code");
    }

    const tokens = await tokenResponse.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Fetch user email for display
    let googleEmail: string | null = null;
    try {
      const userinfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userinfoRes.ok) {
        const userinfo = await userinfoRes.json();
        googleEmail = userinfo.email ?? null;
      }
    } catch {
      // Non-critical
    }

    // Upsert subscription with Google Calendar tokens
    await db.subscription.upsert({
      where: { orgId },
      create: {
        orgId,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry: expiresAt,
        googleEmail,
      },
      update: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry: expiresAt,
        googleEmail,
      },
    });

    return closePopupResponse(true);
  } catch (error) {
    console.error("Workspace calendar OAuth callback error:", error);
    return closePopupResponse(false, "An unexpected error occurred");
  }
}
