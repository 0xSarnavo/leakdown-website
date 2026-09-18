/** Orders backend ported line-for-line in behavior from server.mjs (orders block).
 * Hand-rolled SigV4 fetch, no SDK. No cookies. 500-path logs method+url only. */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export interface Order {
  id: string;
  url: string;
  email: string;
  createdAt: string;
  status: "new" | "done" | "rejected";
  note?: string;
  /** optional, additive: the requester's choices (older orders have none) */
  plan?: "full" | "special";
  brief?: string;
  /** opted in to us posting real, fixed findings publicly (posts, case studies, ads) */
  publish?: boolean;
}

const S3 = {
  bucket: process.env.BUCKET,
  keyId: process.env.ACCESS_KEY_ID,
  secret: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.ENDPOINT,
  region: process.env.REGION || "auto",
};
const ORDERS_TOKEN = process.env.ORDERS_TOKEN;
export const ordersOn = () =>
  !!(S3.bucket && S3.keyId && S3.secret && S3.endpoint && ORDERS_TOKEN);

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (k: Buffer | string, s: string) => createHmac("sha256", k).update(s).digest();

/** AWS SigV4 for one S3 request on the bucket's virtual-hosted URL. No SDK: ~30 lines. */
function s3(method: string, key: string, { body = "", query = "" }: { body?: string; query?: string } = {}) {
  const host = `${S3.bucket}.${new URL(S3.endpoint as string).host}`;
  const path = "/" + key.split("/").map(encodeURIComponent).join("/");
  const amzDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const headers: Record<string, string> = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const names = Object.keys(headers).sort();
  const canonical = [method, path, query, names.map((n) => `${n}:${headers[n]}\n`).join(""), names.join(";"), payloadHash].join("\n");
  const scope = `${date}/${S3.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const kSign = ["aws4_request"].reduce<Buffer | string>(
    (k, s) => hmac(k, s),
    hmac(hmac(hmac(`AWS4${S3.secret}`, date), S3.region), "s3"),
  );
  const signature = createHmac("sha256", kSign).update(toSign).digest("hex");
  return fetch(`https://${host}${path}${query ? `?${query}` : ""}`, {
    method,
    body: method === "PUT" ? body : undefined,
    headers: { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${S3.keyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}` },
  });
}

export const orderKey = (id: string) => `orders/${id}.json`;
export async function getOrder(id: string): Promise<Order | null> {
  const r = await s3("GET", orderKey(id));
  return r.ok ? (JSON.parse(await r.text()) as Order) : null;
}
export async function putOrder(order: Order) {
  const r = await s3("PUT", orderKey(order.id), { body: JSON.stringify(order) });
  if (!r.ok) throw new Error(`bucket PUT ${r.status}`);
  return order;
}
export async function listOrders(): Promise<Order[]> {
  // ponytail: one page of 1000 keys; add continuation-token paging past that
  const r = await s3("GET", "", { query: "list-type=2&prefix=orders%2F" });
  if (!r.ok) throw new Error(`bucket LIST ${r.status}`);
  const keys = [...(await r.text()).matchAll(/<Key>orders\/([^<]+)\.json<\/Key>/g)].map((m) => m[1]);
  const out: (Order | null)[] = [];
  for (let i = 0; i < keys.length; i += 20) out.push(...(await Promise.all(keys.slice(i, i + 20).map(getOrder))));
  return out.filter((o): o is Order => !!o);
}

/** Early-access list: one file per email (re-signups overwrite), same bucket. */
export async function putWaitlist(email: string) {
  const r = await s3("PUT", `waitlist/${sha256(email).slice(0, 16)}.json`, {
    body: JSON.stringify({ email, createdAt: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`bucket PUT ${r.status}`);
}
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120;

export async function readJson(req: Request, max = 4096): Promise<Record<string, unknown> | null> {
  // stream and abort past `max` chars (as server.mjs did) so a huge body never sits in memory
  let raw = "";
  if (req.body) {
    const reader = req.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += dec.decode(value, { stream: true });
      if (raw.length > max) {
        await reader.cancel().catch(() => {});
        throw new Error("body too large");
      }
    }
    raw += dec.decode();
  }
  if (raw.length > max) throw new Error("body too large");
  let b: unknown;
  try { b = raw ? JSON.parse(raw) : {}; } catch { return null; }
  return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : {};
}

// ponytail: per-IP token bucket in memory; enough for one box, add a store if the site ever scales out
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, perMinute = 10) {
  // Railway's edge puts the real client address FIRST and appends whatever the client sent
  // after it (measured 2026-09-14: taking the last entry let rotating spoofed headers through)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "?";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > perMinute;
}

export function authed(req: Request) {
  const given = Buffer.from((req.headers.get("authorization") || "").replace(/^Bearer /, ""));
  const want = Buffer.from(ORDERS_TOKEN || "");
  // compare BYTE lengths: timingSafeEqual throws on a byte-length mismatch, and a
  // multibyte header with the right char count would otherwise turn 401 into 500
  return !!ORDERS_TOKEN && given.length === want.length && timingSafeEqual(given, want);
}

export type Validated =
  | { ok: true; target: string; email: string; plan: "full" | "special"; brief: string; publish: boolean }
  | { ok: false; error: string };
/** 400-strings EXACT per 03-01-PARITY.md; slice caps applied by the caller at store time. */
export function validateRequest(b: {
  url?: unknown;
  email?: unknown;
  consent?: unknown;
  plan?: unknown;
  brief?: unknown;
  publish?: unknown;
}): Validated {
  const target = String(b.url ?? "").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  // a full URL, no whitespace anywhere (it ends up in a mail header), no bare IPs or internal names
  if (!/^https?:\/\/[^\s/]+\.[^\s/]{2,}\S*$/.test(target) || /^https?:\/\/(\d{1,3}(\.\d{1,3}){3}|\[|[^/]*\.(local|internal|localhost)(\/|$|:))/i.test(target))
    return { ok: false, error: "give a full public site URL, like https://example.com" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120)
    return { ok: false, error: "give a real email" };
  if (b.consent !== true) return { ok: false, error: "confirm you own or are authorised to test this site" };
  // additive fields never reject: anything unexpected falls back to the default full run
  const plan = b.plan === "special" ? "special" : "full";
  const brief = plan === "special" ? String(b.brief ?? "").trim().slice(0, 600) : "";
  return { ok: true, target, email, plan, brief, publish: b.publish === true };
}

/** Shared 500 for route handlers: logs method+url only (no body). */
export function serverError(scope: string, e: unknown): Response {
  console.error(`${scope} — ${(e as Error).message}`);
  return new Response("server error\n", { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
}
