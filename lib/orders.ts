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

/**
 * Said once per instance, at the first intake request: storage open, bot check
 * off. That is the shape a preview deploy has by default, and it is also the
 * shape a production deploy has when TURNSTILE_SECRET was never set — the
 * difference matters and nothing else would say so.
 */
let warned = false;
export function warnIfUnguarded(humanCheckOn: boolean): void {
  if (warned || !ordersOn() || humanCheckOn) return;
  warned = true;
  console.warn("intake is open with no human check — TURNSTILE_SECRET is not set on this deployment");
}

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
    // consent is recorded, not just checked: the list is a contact list, and
    // "they ticked the box" has to survive the request that carried it
    body: JSON.stringify({ email, createdAt: new Date().toISOString(), consent: true }),
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

/**
 * Per-IP limit, 10 a minute.
 *
 * One long-lived box (Railway): the in-memory map below is the whole story.
 * Serverless (Vercel): every instance keeps its own map, so the limit is only
 * as tight as the instance count. Set UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN there and the count moves to Redis, shared by every
 * instance. No SDK: the REST API is one fetch.
 */
const hits = new Map<string, number[]>();
const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * The client address, first entry only.
 * Railway's edge puts the real client address FIRST and appends whatever the
 * client sent after it (measured 2026-09-14: taking the last entry let rotating
 * spoofed headers through). Vercel signs its own `x-vercel-forwarded-for`,
 * which a client cannot forge, so prefer that when it is there.
 */
function clientIp(req: Request) {
  const h = req.headers;
  return (h.get("x-vercel-forwarded-for") || h.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
}

function memoryLimited(ip: string, perMinute: number) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > perMinute;
}

export async function rateLimited(req: Request, perMinute = 10) {
  const ip = clientIp(req);
  if (!KV_URL || !KV_TOKEN) return memoryLimited(ip, perMinute);
  // INCR then EXPIRE ... NX in one round trip: the window starts at the first hit
  const key = `rl:${sha256(ip).slice(0, 16)}`;
  try {
    const r = await fetch(`${KV_URL}/pipeline`, {
      method: "POST",
      cache: "no-store",
      headers: { authorization: `Bearer ${KV_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, 60, "NX"]]),
    });
    if (!r.ok) throw new Error(`kv ${r.status}`);
    const [incr] = (await r.json()) as Array<{ result: number }>;
    return incr.result > perMinute;
  } catch (e) {
    // fail OPEN, and say so: a Redis blip must not take the intake form down.
    // The email-per-day key in the bucket still caps repeat orders either way.
    console.error(`rate limit store unreachable, allowing — ${(e as Error).message}`);
    return memoryLimited(ip, perMinute);
  }
}

/**
 * How many new records the bucket may take in a day, across everyone.
 *
 * The per-address limit above bounds one sender; it does not bound a thousand
 * of them, and every accepted request writes an object that has to be stored,
 * listed and read past forever after. This is the ceiling that holds whoever is
 * calling: once the day's allowance is used the intake answers "full" until UTC
 * midnight, and nothing new is written. Raise it with INTAKE_DAILY_MAX.
 *
 * Fails OPEN and says so, like the rate limiter: a counter outage must not shut
 * the form. Without a shared store there is no day counter at all, which is the
 * state to fix before this is advertised widely.
 */
const INTAKE_DAILY_MAX = Number(process.env.INTAKE_DAILY_MAX ?? 200);

const intakeKey = (kind: "orders" | "waitlist") =>
  `intake:${kind}:${new Date().toISOString().slice(0, 10)}`;

async function kv(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const r = await fetch(`${KV_URL}/pipeline`, {
      method: "POST",
      cache: "no-store",
      headers: { authorization: `Bearer ${KV_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(2_000),
    });
    if (!r.ok) throw new Error(`kv ${r.status}`);
    return ((await r.json()) as Array<{ result: unknown }>).map((e) => e.result);
  } catch (e) {
    console.error(`intake counter unreachable, allowing — ${(e as Error).message}`);
    return null;
  }
}

/** Reads the day's count. Does not spend it — `intakeDone` does, after the write. */
export async function intakeFull(kind: "orders" | "waitlist"): Promise<boolean> {
  const res = await kv([["GET", intakeKey(kind)]]);
  const raw = res?.[0];
  const used = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : 0;
  return Number.isFinite(used) && used >= INTAKE_DAILY_MAX;
}

/**
 * Counts one accepted record, after it is safely stored.
 *
 * Counting before the write would let a flaking bucket eat the day's allowance
 * without a single record to show for it. The order costs a small race — a burst
 * can overshoot by however many requests are in flight — which is the right way
 * round for a ceiling whose job is bounding a day, not a millisecond.
 */
export async function intakeDone(kind: "orders" | "waitlist"): Promise<void> {
  await kv([
    ["INCR", intakeKey(kind)],
    ["EXPIRE", intakeKey(kind), 86400, "NX"],
  ]);
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
