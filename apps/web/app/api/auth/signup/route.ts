import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@liveagent/db";
import { getSession } from "@lib/session";

const DEFAULT_ORG_ID = "default";

export async function POST(req: NextRequest) {
  try {
    const allowSignup = process.env.ALLOW_SIGNUP === "true";
    if (!allowSignup) {
      return NextResponse.json({ error: "Signup is disabled" }, { status: 403 });
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { username, password: hash, orgId: DEFAULT_ORG_ID },
    });

    // Ensure subscription record exists
    await db.subscription.upsert({
      where: { orgId: DEFAULT_ORG_ID },
      create: { orgId: DEFAULT_ORG_ID },
      update: {},
    });

    // Auto-login after signup
    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.orgId = user.orgId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, username: user.username }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
