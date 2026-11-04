import { NextRequest, NextResponse } from "next/server";
import { expireStaleRequests } from "@/lib/expire";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expired = await expireStaleRequests();
  return NextResponse.json({ ok: true, expired, at: new Date().toISOString() });
}
