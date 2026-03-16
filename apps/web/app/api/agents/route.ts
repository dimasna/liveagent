import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";
import { DEFAULT_OPERATING_HOURS } from "@liveagent/shared";

// GET /api/agents - List agents for org
export async function GET() {
  try {
    const { orgId } = await getAuthUser();

    const agents = await db.agent.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            conversations: true,
            callLogs: true,
          },
        },
      },
    });

    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthUser();
    const body = await req.json();

    const agent = await db.agent.create({
      data: {
        orgId,
        name: body.name || "Booking Agent",
        username: body.username || null,
        businessName: body.businessName || "",
        businessType: body.businessType || "restaurant",
        timezone: body.timezone || "America/New_York",
        instruction: body.instruction || "",
        greeting: body.greeting || "Hello! How can I help you with your reservation today?",
        voice: body.voice || "Puck",
        operatingHours: body.operatingHours || DEFAULT_OPERATING_HOURS,
        bookingDuration: body.bookingDuration || 60,
        maxAdvanceDays: body.maxAdvanceDays || 30,
        capacityType: body.capacityType || "slots",
        capacityCount: body.capacityCount || 0,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
