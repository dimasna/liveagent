import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/agents/:id/resources — List all resources for an agent
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const resources = await db.resource.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// POST /api/agents/:id/resources — Create a single resource
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const resource = await db.resource.create({
      data: {
        agentId: id,
        name: body.name,
        type: body.type,
        capacity: body.capacity ?? 1,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
