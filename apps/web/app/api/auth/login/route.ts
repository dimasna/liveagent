import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@liveagent/db";
import { getSession } from "@lib/session";

const DEFAULT_ORG_ID = "default";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    let user = await db.user.findUnique({ where: { username } });

    // Lazy seed: if no users exist and credentials match env defaults, create the user
    if (!user) {
      const envUser = process.env.AUTH_USERNAME;
      const envPass = process.env.AUTH_PASSWORD;

      if (envUser && envPass && username === envUser && password === envPass) {
        const userCount = await db.user.count();
        if (userCount === 0) {
          const hash = await bcrypt.hash(password, 12);
          user = await db.user.create({
            data: { username, password: hash, orgId: DEFAULT_ORG_ID },
          });

          // Ensure subscription record exists for this org
          await db.subscription.upsert({
            where: { orgId: DEFAULT_ORG_ID },
            create: { orgId: DEFAULT_ORG_ID },
            update: {},
          });
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.orgId = user.orgId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, username: user.username });
  } catch (e) {
    console.error("Login error:", e);
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
