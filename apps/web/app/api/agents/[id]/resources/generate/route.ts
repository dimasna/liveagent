import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";
import { getResourceTypeConfig } from "@liveagent/shared";

type Params = { params: Promise<{ id: string }> };

// POST /api/agents/:id/resources/generate — Bulk-create resources from template
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    const { businessType, count, capacityPerUnit } = body as {
      businessType: string;
      count: number;
      capacityPerUnit?: number;
    };

    if (!count || count < 1 || count > 100) {
      return NextResponse.json(
        { error: "count must be between 1 and 100" },
        { status: 400 }
      );
    }

    const agent = await db.agent.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const config = getResourceTypeConfig(businessType || "other");
    const capacity = capacityPerUnit ?? config.defaultCapacity;

    // Delete existing resources first (regenerate)
    await db.resource.deleteMany({ where: { agentId: id } });

    // Bulk-create resources
    const data = Array.from({ length: count }, (_, i) => ({
      agentId: id,
      name: config.nameTemplate.replace("{n}", String(i + 1)),
      type: config.type,
      capacity,
    }));

    await db.resource.createMany({ data });

    // Update agent capacity fields
    await db.agent.updateMany({
      where: { id, orgId },
      data: {
        capacityType: config.type,
        capacityCount: count,
      },
    });

    const resources = await db.resource.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      count: resources.length,
      resourceType: config.type,
      resourceLabel: config.label,
      resources,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
