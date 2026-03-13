import { NextRequest, NextResponse } from "next/server";
import { db } from "@liveagent/db";
import { getAuthUser, getErrorStatus } from "@lib/auth";

// GET /api/conversations - List conversations for org's agents
export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthUser();
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = {
      agent: { orgId },
      ...(agentId && { agentId }),
      ...(status && { status: status as any }),
    };

    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where,
        include: {
          agent: { select: { name: true, businessName: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" as const },
          },
        },
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
