import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { intakeFull, ordersOn, putWaitlist, rateLimited, readJson, serverError, validEmail } from "@/lib/orders";
import { human } from "@/lib/turnstile";

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
    // the list exists to write to people later, so the record is only worth
    // keeping when they agreed to that — the same gate /request applies
    if (b.consent !== true)
      return NextResponse.json({ error: "tick the box to join the list" }, { status: 400 });
    if (!(await human(b.token, "early-access", (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim())))
      return NextResponse.json({ error: "the human check did not pass — reload and try again" }, { status: 403 });
    if (await intakeFull("waitlist"))
      return NextResponse.json({ error: "the list is full for today — try again tomorrow" }, { status: 503 });
    await putWaitlist(email);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return serverError("POST /api/early-access", e);
  }
}
