import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { authed, getOrder, ordersOn, putOrder, readJson, serverError, type Order } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const badId = (id: string) => !/^[A-Za-z0-9._-]{1,80}$/.test(id);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // fallthrough lives outside try: notFound() throws, and the catch below must
  // only turn real failures (bucket GET) into 500s.
  const { id } = await params;
  if (badId(id)) notFound();
  if (!ordersOn()) notFound();
  try {
    if (!authed(req)) return NextResponse.json({ error: "no" }, { status: 401 });
    const o = await getOrder(id);
    return o ? NextResponse.json(o) : NextResponse.json({ error: "no such order" }, { status: 404 });
  } catch (e) {
    return serverError(`GET /orders/${id}`, e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // fallthrough lives outside try: see GET above.
  const { id } = await params;
  if (badId(id)) notFound();
  if (!ordersOn()) notFound();
  try {
    if (!authed(req)) return NextResponse.json({ error: "no" }, { status: 401 });
    const o = await getOrder(id);
    if (!o) return NextResponse.json({ error: "no such order" }, { status: 404 });
    const b = await readJson(req);
    if (!b || !["new", "done", "rejected"].includes(b.status as string))
      return NextResponse.json({ error: "status must be new|done|rejected" }, { status: 400 });
    return NextResponse.json(
      await putOrder({ ...o, status: b.status as Order["status"], note: String(b.note || "").slice(0, 300) }),
    );
  } catch (e) {
    return serverError(`POST /orders/${id}`, e);
  }
}
