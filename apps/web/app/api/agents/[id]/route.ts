import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/agents/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      include: {
        _count: {
          select: { conversations: true, callLogs: true },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// PUT /api/agents/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    const agent = await db.agent.updateMany({
      where: { id, orgId },
      data: {
        name: body.name,
        businessName: body.businessName,
        businessType: body.businessType,
        timezone: body.timezone,
        instruction: body.instruction,
        greeting: body.greeting,
        voice: body.voice,
        model: body.model,
        language: body.language,
        operatingHours: body.operatingHours,
        bookingDuration: body.bookingDuration,
        maxAdvanceDays: body.maxAdvanceDays,
        status: body.status,
      },
    });

    if (agent.count === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const updated = await db.agent.findFirst({ where: { id, orgId } });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// DELETE /api/agents/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    const result = await db.agent.deleteMany({
      where: { id, orgId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
