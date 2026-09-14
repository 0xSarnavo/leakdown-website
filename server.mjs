/**
 * Static file server for the Leakdown site.
 *
 * Zero dependencies on purpose: the site is plain files, and Railway only needs
 * something that listens on $PORT.
 */
import { createServer } from "node:http";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "public");
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// the page has no inline script or style, so the policy can be strict
const SECURITY = {
  "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "strict-transport-security": "max-age=31536000",
};

/* ---------------- orders: a private S3 bucket, nothing ever runs here ----------------
 * People leave a URL and an email. The operator lists orders from their own
 * machine (leakdown --orders) and runs the ones they choose. Spam is a
 * row nobody runs. Credentials come from the Railway bucket's variables.
 */
const S3 = {
  bucket: process.env.BUCKET,
  keyId: process.env.ACCESS_KEY_ID,
  secret: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.ENDPOINT,
  region: process.env.REGION || "auto",
};
const ORDERS_TOKEN = process.env.ORDERS_TOKEN;
const ordersOn = !!(S3.bucket && S3.keyId && S3.secret && S3.endpoint && ORDERS_TOKEN);

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const hmac = (k, s) => createHmac("sha256", k).update(s).digest();

/** AWS SigV4 for one S3 request on the bucket's virtual-hosted URL. No SDK: ~30 lines. */
function s3(method, key, { body = "", query = "" } = {}) {
  const host = `${S3.bucket}.${new URL(S3.endpoint).host}`;
  const path = "/" + key.split("/").map(encodeURIComponent).join("/");
  const amzDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const headers = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const names = Object.keys(headers).sort();
  const canonical = [method, path, query, names.map((n) => `${n}:${headers[n]}\n`).join(""), names.join(";"), payloadHash].join("\n");
  const scope = `${date}/${S3.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const kSign = ["aws4_request"].reduce((k, s) => hmac(k, s), hmac(hmac(hmac(`AWS4${S3.secret}`, date), S3.region), "s3"));
  const signature = createHmac("sha256", kSign).update(toSign).digest("hex");
  return fetch(`https://${host}${path}${query ? `?${query}` : ""}`, {
    method,
    body: method === "PUT" ? body : undefined,
    headers: { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${S3.keyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}` },
  });
}

const orderKey = (id) => `orders/${id}.json`;
async function getOrder(id) {
  const r = await s3("GET", orderKey(id));
  return r.ok ? JSON.parse(await r.text()) : null;
}
async function putOrder(order) {
  const r = await s3("PUT", orderKey(order.id), { body: JSON.stringify(order) });
  if (!r.ok) throw new Error(`bucket PUT ${r.status}`);
  return order;
}
async function listOrders() {
  // ponytail: one page of 1000 keys; add continuation-token paging past that
  const r = await s3("GET", "", { query: "list-type=2&prefix=orders%2F" });
  if (!r.ok) throw new Error(`bucket LIST ${r.status}`);
  const keys = [...(await r.text()).matchAll(/<Key>orders\/([^<]+)\.json<\/Key>/g)].map((m) => m[1]);
  const out = [];
  for (let i = 0; i < keys.length; i += 20) out.push(...(await Promise.all(keys.slice(i, i + 20).map(getOrder))));
  return out.filter(Boolean);
}

// returns true so a route can `return json(...)` and the caller knows it was handled
const json = (res, code, body) => { res.writeHead(code, { ...SECURITY, "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(body)); return true; };
async function readJson(req, max = 4096) {
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > max) throw new Error("body too large"); }
  let b;
  try { b = raw ? JSON.parse(raw) : {}; } catch { return null; }
  return b && typeof b === "object" && !Array.isArray(b) ? b : {};
}

// ponytail: per-IP token bucket in memory; enough for one box, add a store if the site ever scales out
const hits = new Map();
function rateLimited(req, perMinute = 10) {
  // Railway's edge puts the real client address FIRST and appends whatever the client sent
  // after it (measured 2026-09-14: taking the last entry let rotating spoofed headers through)
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "?";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > perMinute;
}
function authed(req) {
  const given = (req.headers.authorization || "").replace(/^Bearer /, "");
  return given.length === ORDERS_TOKEN.length && timingSafeEqual(Buffer.from(given), Buffer.from(ORDERS_TOKEN));
}

/** true when the request was an orders route (handled), false to fall through to static files */
async function ordersRoute(req, res, url) {
  if (!ordersOn) return false;
  if (req.method === "POST" && url.pathname === "/request") {
    if (rateLimited(req)) return json(res, 429, { error: "slow down" });
    const b = await readJson(req);
    if (!b) return json(res, 400, { error: "send JSON" });
    const target = String(b.url || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    // a full URL, no whitespace anywhere (it ends up in a mail header), no bare IPs or internal names
    if (!/^https?:\/\/[^\s/]+\.[^\s/]{2,}\S*$/.test(target) || /^https?:\/\/(\d{1,3}(\.\d{1,3}){3}|\[|[^/]*\.(local|internal|localhost)(\/|$|:))/i.test(target))
      return json(res, 400, { error: "give a full public site URL, like https://example.com" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return json(res, 400, { error: "give a real email" });
    if (b.consent !== true) return json(res, 400, { error: "confirm you own or are authorised to test this site" });
    // one order per email per day: the key is the date plus the email, so a repeat overwrites
    const id = `${new Date().toISOString().slice(0, 10)}-${sha256(email).slice(0, 10)}`;
    const existing = await getOrder(id);
    if (existing && existing.status !== "new") return json(res, 429, { error: "one request per day — yours was already handled" });
    await putOrder({ id, url: target.slice(0, 300), email, createdAt: new Date().toISOString(), status: "new" });
    return json(res, 201, { ok: true, id });
  }
  const m = url.pathname.match(/^\/orders(?:\/([A-Za-z0-9._-]{1,80}))?$/);
  if (!m) return false;
  if (!authed(req)) return json(res, 401, { error: "no" });
  if (req.method === "GET" && !m[1]) {
    const all = url.searchParams.get("all") === "1";
    const orders = await listOrders();
    return json(res, 200, (all ? orders : orders.filter((o) => o.status === "new")).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  }
  if (req.method === "GET" && m[1]) {
    const o = await getOrder(m[1]);
    return o ? json(res, 200, o) : json(res, 404, { error: "no such order" });
  }
  if (req.method === "POST" && m[1]) {
    const o = await getOrder(m[1]);
    if (!o) return json(res, 404, { error: "no such order" });
    const b = await readJson(req);
    if (!b || !["new", "done", "rejected"].includes(b.status)) return json(res, 400, { error: "status must be new|done|rejected" });
    return json(res, 200, await putOrder({ ...o, status: b.status, note: String(b.note || "").slice(0, 300) }));
  }
  return false;
}

const notFound = (res, what) => { res.writeHead(404, { ...SECURITY, "content-type": "text/plain; charset=utf-8" }); res.end(`not found: ${what}\n`); };

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (await ordersRoute(req, res, url)) return;
    // normalize() resolves any ".." away, and a pathname always starts at "/", so this
    // cannot climb out of ROOT
    let path;
    try { path = normalize(decodeURIComponent(url.pathname)); } catch { return notFound(res, url.pathname); }
    let file = join(ROOT, path);
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) { file = join(file, "index.html"); info = await stat(file).catch(() => null); }
    // /privacy is privacy.html; anything else that does not exist is a 404 page with a 404 status
    if (!info && !extname(path)) { file = `${file}.html`; info = await stat(file).catch(() => null); }
    let status = 200;
    if (!info) {
      if (extname(path) in TYPES) return notFound(res, path);
      file = join(ROOT, "404.html");
      info = await stat(file).catch(() => null);
      if (!info) return notFound(res, path);
      status = 404;
    }

    const ext = extname(file);
    // Nothing here has a hash in its name — the generator rewrites every file in place, assets
    // included. So everything is revalidated rather than cached blind, and an ETag off size and
    // mtime makes that cheap: unchanged files come back as an empty 304.
    const etag = `W/"${info.size.toString(16)}-${Math.round(info.mtimeMs).toString(16)}"`;
    const headers = {
      ...SECURITY,
      "content-type": TYPES[ext] ?? "application/octet-stream",
      "cache-control": "no-cache",
      "accept-ranges": "bytes",
      etag,
    };
    if (req.headers["if-none-match"] === etag) { res.writeHead(304, headers); return res.end(); }

    // <video> asks for byte ranges to seek; without this it can only ever play from the start
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range && info.size) {
      const start = range[1] ? Number(range[1]) : info.size - Number(range[2]);
      const end = range[1] && range[2] ? Number(range[2]) : info.size - 1;
      if (!(start >= 0 && end < info.size && start <= end)) {
        res.writeHead(416, { "content-range": `bytes */${info.size}` });
        return res.end();
      }
      const body = await readFile(file);
      res.writeHead(206, { ...headers, "content-length": end - start + 1,
                           "content-range": `bytes ${start}-${end}/${info.size}` });
      return res.end(body.subarray(start, end + 1));
    }

    const body = await readFile(file);
    res.writeHead(status, { ...headers, "content-length": body.length });
    res.end(body);
  } catch (e) {
    console.error(`${req.method} ${req.url} — ${e.message}`);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("server error\n");
  }
}).listen(PORT, () => console.log(`leakdown site on :${PORT}`));
