import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const isDev = process.env.NODE_ENV !== "production";
let cached: string | null = null;

export async function GET() {
  if (!cached || isDev) {
    cached = readFileSync(join(process.cwd(), "public", "widget.js"), "utf-8");
  }

  return new NextResponse(cached, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": isDev ? "no-cache" : "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
