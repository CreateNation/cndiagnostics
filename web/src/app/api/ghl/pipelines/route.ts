import { NextResponse } from "next/server";
import { listGhlPipelines } from "@/lib/ghl";

/**
 * Helper for setup: lists GHL pipelines + stage IDs for this location.
 * Protect with SETUP_SECRET if set: /api/ghl/pipelines?key=...
 */
export async function GET(req: Request) {
  const setupSecret = process.env.SETUP_SECRET;
  if (setupSecret) {
    const key = new URL(req.url).searchParams.get("key");
    if (key !== setupSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await listGhlPipelines();
  if (result.error) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
