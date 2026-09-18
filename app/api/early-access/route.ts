import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { ordersOn, putWaitlist, rateLimited, readJson, serverError, validEmail } from "@/lib/orders";

// node:crypto (SigV4, timing-safe compare) needs the Node runtime, which is
// the default for route handlers but is worth pinning where hosts differ
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Early access: email only. Same gate, cap and rate limit as /request. */
export async function POST(req: Request) {
  if (!ordersOn()) notFound();
  try {
    if (await rateLimited(req)) return NextResponse.json({ error: "slow down" }, { status: 429 });
    const b = await readJson(req, 512);
    if (!b) return NextResponse.json({ error: "send JSON" }, { status: 400 });
    const email = String(b.email ?? "").trim().toLowerCase();
    if (!validEmail(email)) return NextResponse.json({ error: "give a real email" }, { status: 400 });
    await putWaitlist(email);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return serverError("POST /api/early-access", e);
  }
}
