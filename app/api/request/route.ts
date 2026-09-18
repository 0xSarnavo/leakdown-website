import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { warnIfUnguarded, getOrder, intakeDone, intakeFull, ordersOn, putOrder, rateLimited, readJson, serverError, sha256, validateRequest } from "@/lib/orders";
import { human, turnstileOn } from "@/lib/turnstile";

// node:crypto (SigV4, timing-safe compare) needs the Node runtime, which is
// the default for route handlers but is worth pinning where hosts differ
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // fallthrough lives outside try: notFound() throws, and the catch below must
  // only turn real failures (bucket PUT/LIST, oversize body) into 500s.
  if (!ordersOn()) notFound();
  try {
    warnIfUnguarded(turnstileOn());
    if (await rateLimited(req)) return NextResponse.json({ error: "slow down" }, { status: 429 });
    const b = await readJson(req);
    if (!b) return NextResponse.json({ error: "send JSON" }, { status: 400 });
    const v = validateRequest(b);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    // after validation, before anything is written: a failed check costs no storage
    if (!(await human(b.token, "request-run", (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim())))
      return NextResponse.json({ error: "the human check did not pass — reload and try again" }, { status: 403 });
    // one order per email per day: the key is the date plus the email, so a repeat overwrites
    const id = `${new Date().toISOString().slice(0, 10)}-${sha256(v.email).slice(0, 10)}`;
    const existing = await getOrder(id);
    if (existing && existing.status !== "new")
      return NextResponse.json({ error: "one request per day — yours was already handled" }, { status: 429 });
    // a repeat from the same email reuses its key, so only a NEW record counts
    if (!existing && (await intakeFull("orders")))
      return NextResponse.json({ error: "the queue is full for today — try again tomorrow" }, { status: 503 });
    await putOrder({
      id,
      url: v.target.slice(0, 300),
      email: v.email,
      createdAt: new Date().toISOString(),
      status: "new",
      plan: v.plan,
      ...(v.brief ? { brief: v.brief } : {}),
      publish: v.publish,
    });
    if (!existing) await intakeDone("orders");
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    return serverError("POST /request", e);
  }
}
