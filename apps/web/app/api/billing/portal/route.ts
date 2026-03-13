import { NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

const DODO_API_URL = "https://api.dodopayments.com";

// GET /api/billing/portal - Get billing portal URL for the org
export async function GET() {
  try {
    const { orgId } = await getAuthUser();

    const subscription = await db.subscription.findUnique({
      where: { orgId },
    });

    if (!subscription?.customerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 404 }
      );
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Billing is not configured" },
        { status: 503 }
      );
    }

    const response = await fetch(
      `${DODO_API_URL}/customers/${subscription.customerId}/customer-portal/session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          send_email: false,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("DodoPayments portal error:", errorBody);
      return NextResponse.json(
        { error: "Failed to retrieve billing portal" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({ url: data.link });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
