import { NextResponse } from "next/server";
import { retryDueMetaPurchases } from "@/lib/meta/capi-purchase";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // On Vercel, require a secret so the route is not public.
    if (process.env.VERCEL) return false;
    return true;
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = req.headers.get("x-cron-secret");
  return header === secret;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await retryDueMetaPurchases(25);
  return NextResponse.json({ ok: true, ...result });
}

/** Vercel Cron uses GET; allow POST for manual ops. */
export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
