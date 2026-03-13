import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

const DODO_API_URL = "https://api.dodopayments.com";

const PLAN_PRODUCT_MAP: Record<string, string> = {
  STARTER: "starter_monthly",
  GROWTH: "growth_monthly",
  SCALE: "scale_monthly",
  ENTERPRISE: "enterprise_monthly",
};

// POST /api/billing/checkout - Create a billing checkout session
export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthUser();
    const { plan } = await req.json();

    if (!plan || !PLAN_PRODUCT_MAP[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be one of: STARTER, GROWTH, SCALE, ENTERPRISE" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Billing is not configured" },
        { status: 503 }
      );
    }

    // Ensure the org has a subscription record
    let subscription = await db.subscription.findUnique({
      where: { orgId },
    });

    if (!subscription) {
      subscription = await db.subscription.create({
        data: { orgId },
      });
    }

    // Create checkout session via DodoPayments API
    const response = await fetch(`${DODO_API_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        billing: {
          city: "",
          country: "US",
          state: "",
          street: "",
          zipcode: "",
        },
        customer: {
          email: "", // Clerk will fill via webhook
          name: orgId,
        },
        product_id: PLAN_PRODUCT_MAP[plan],
        quantity: 1,
        payment_link: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
        metadata: {
          orgId,
          plan,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("DodoPayments checkout error:", errorBody);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      url: data.payment_link,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
