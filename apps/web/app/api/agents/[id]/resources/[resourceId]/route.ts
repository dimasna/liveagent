import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

type Params = { params: Promise<{ id: string; resourceId: string }> };

// PUT /api/agents/:id/resources/:resourceId — Update a resource
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id, resourceId } = await params;
    const body = await req.json();

    // Verify agent belongs to org
    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const resource = await db.resource.updateMany({
      where: { id: resourceId, agentId: id },
      data: {
        name: body.name,
        capacity: body.capacity,
        status: body.status,
      },
    });

    if (resource.count === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    const updated = await db.resource.findUnique({
      where: { id: resourceId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}

// DELETE /api/agents/:id/resources/:resourceId — Delete a resource
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id, resourceId } = await params;

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const result = await db.resource.deleteMany({
      where: { id: resourceId, agentId: id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
