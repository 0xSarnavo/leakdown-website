import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { authed, listOrders, ordersOn, serverError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // fallthrough lives outside try: notFound() throws, and the catch below must
  // only turn real failures (bucket LIST) into 500s.
  if (!ordersOn()) notFound();
  try {
    if (!authed(req)) return NextResponse.json({ error: "no" }, { status: 401 });
    const all = new URL(req.url).searchParams.get("all") === "1";
    const orders = await listOrders();
    return NextResponse.json(
      (all ? orders : orders.filter((o) => o.status === "new")).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  } catch (e) {
    return serverError(`GET ${new URL(req.url).pathname}`, e);
  }
}
