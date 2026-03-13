import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import crypto from "crypto";

const PLAN_LIMITS: Record<string, { maxAgents: number; maxMinutesMonth: number }> = {
  STARTER: { maxAgents: 3, maxMinutesMonth: 500 },
  GROWTH: { maxAgents: 10, maxMinutesMonth: 2000 },
  SCALE: { maxAgents: 25, maxMinutesMonth: 10000 },
  ENTERPRISE: { maxAgents: 100, maxMinutesMonth: 50000 },
};

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// POST /api/webhooks/dodo - Handle DodoPayments webhooks
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    if (!secret) {
      console.error("DODO_PAYMENTS_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("webhook-signature") ?? "";

    if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event_type ?? event.type;

    switch (eventType) {
      case "subscription.created": {
        const { metadata, customer, subscription } = event.data;
        const orgId = metadata?.orgId;
        const plan = metadata?.plan;

        if (!orgId) {
          console.error("subscription.created: missing orgId in metadata");
          break;
        }

        const limits = plan ? PLAN_LIMITS[plan] : undefined;

        await db.subscription.upsert({
          where: { orgId },
          create: {
            orgId,
            plan: plan ?? "STARTER",
            status: "ACTIVE",
            customerId: customer?.customer_id ?? null,
            subscriptionId: subscription?.subscription_id ?? null,
            maxAgents: limits?.maxAgents ?? 3,
            maxMinutesMonth: limits?.maxMinutesMonth ?? 500,
          },
          update: {
            plan: plan ?? "STARTER",
            status: "ACTIVE",
            customerId: customer?.customer_id ?? null,
            subscriptionId: subscription?.subscription_id ?? null,
            maxAgents: limits?.maxAgents ?? 3,
            maxMinutesMonth: limits?.maxMinutesMonth ?? 500,
          },
        });
        break;
      }

      case "subscription.updated": {
        const { metadata, subscription } = event.data;
        const orgId = metadata?.orgId;
        const plan = metadata?.plan;

        if (!orgId) {
          console.error("subscription.updated: missing orgId in metadata");
          break;
        }

        const limits = plan ? PLAN_LIMITS[plan] : undefined;
        const updateData: Record<string, unknown> = {};

        if (plan) {
          updateData.plan = plan;
        }
        if (limits) {
          updateData.maxAgents = limits.maxAgents;
          updateData.maxMinutesMonth = limits.maxMinutesMonth;
        }
        if (subscription?.status) {
          const statusMap: Record<string, string> = {
            active: "ACTIVE",
            past_due: "PAST_DUE",
            cancelled: "CANCELED",
            trialing: "TRIALING",
          };
          updateData.status = statusMap[subscription.status] ?? "ACTIVE";
        }

        await db.subscription.update({
          where: { orgId },
          data: updateData,
        });
        break;
      }

      case "subscription.cancelled": {
        const { metadata } = event.data;
        const orgId = metadata?.orgId;

        if (!orgId) {
          console.error("subscription.cancelled: missing orgId in metadata");
          break;
        }

        await db.subscription.update({
          where: { orgId },
          data: {
            status: "CANCELED",
          },
        });
        break;
      }

      case "payment.succeeded": {
        // Log successful payment; subscription status stays active.
        const { metadata } = event.data;
        const orgId = metadata?.orgId;

        if (orgId) {
          await db.subscription.update({
            where: { orgId },
            data: {
              status: "ACTIVE",
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled DodoPayments event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
