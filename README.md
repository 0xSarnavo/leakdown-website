# Leakdown — site (Next.js on Railway)

Marketing site + alpha intake API. Next.js App Router, zero extra dependencies:
the only packages are `next`, `react`, `react-dom`.

## Local

```bash
npm install
npm run dev                # http://localhost:3000
```

## Deploy (Railway)

```bash
railway login
railway link               # pick the Leakdown project / website service
railway up --detach        # deploy from this folder
```

`railway.json` pins the Nixpacks builder and `npm start` as the start command,
with `/` as the healthcheck path. `next.config.mjs` uses `output: "standalone"`.

## Environment variables (service dashboard)

| Name                | Required | What it does                                        |
| ------------------- | -------- | --------------------------------------------------- |
| `BUCKET`            | yes      | Private bucket name holding `orders/*.json`         |
| `ACCESS_KEY_ID`     | yes      | Bucket read/write key                               |
| `SECRET_ACCESS_KEY` | yes      | Bucket secret                                       |
| `ENDPOINT`          | yes      | S3-compatible endpoint URL                          |
| `REGION`            | no       | SigV4 region; defaults to `auto`                    |
| `ORDERS_TOKEN`      | yes      | Bearer token guarding the operator routes           |

All five of `BUCKET`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `ENDPOINT` and
`ORDERS_TOKEN` must be set or the request flow stays off: `GET /orders`
falls through to a 404, and the page keeps the request form hidden with a
"closed" note. (`REGION` is optional — it defaults to `auto`.)

## Routes

| Method | Path              | Auth | Behaviour                                                               |
| ------ | ----------------- | ---- | ----------------------------------------------------------------------- |
| `POST` | `/request`        | no   | New alpha request `{url, email, consent:true, plan?, brief?, publish?}` → `201 {ok:true, id}` |
| `POST` | `/api/early-access` | no | Email only `{email}`; same gate, cap and rate limit as `/request`         |
| `GET`  | `/orders`         | yes  | New orders, oldest first; `?all=1` includes `done`/`rejected`            |
| `GET`  | `/orders/:id`     | yes  | One order, or `404 {error:"no such order"}`                              |
| `POST` | `/orders/:id`     | yes  | Set `{status: new\|done\|rejected, note?}` (note capped at 300 chars)    |

The canonical handlers live under `/api/*` (`app/api/`); `/request`,
`/orders` and `/orders/:id` are Next.js rewrites kept alive for parity with
the old intake form's probe + submit paths.

Auth is `Authorization: Bearer $ORDERS_TOKEN` (constant-time compare).

Validation on `POST /request`:

- `url` must be a full public `http(s)` URL — no bare IPs, no
  `.local`/`.internal`/`localhost`, no whitespace; truncated to 300 chars.
- `email` must look like an email, max 120 chars (lowercased).
- `consent` must be `true` (the "I own this site" checkbox).
- `plan` is `full` (default) or `special`; `brief` (max 600 chars) is required with `special`; `publish` is an optional boolean.
- One request per email per day (a repeat overwrites while still `new`; a
  handled order answers `429`).
- Rate limit: 10 requests/min per IP (first entry of `x-forwarded-for`).

The front page probes `GET /orders` on load: a `401` means the bucket and
token are live, so it unhides the request form; anything else leaves the
"closed" note up.

Status enum: `new` → `done` | `rejected`.

## Security headers

`proxy.ts` (the Next 16 name for middleware) stamps every response with a per-request-nonce CSP
(`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, no
third-party scripts, no external fonts, no analytics), plus
`strict-transport-security` (HSTS, 1 year, includeSubDomains),
`x-content-type-options: nosniff`, `x-frame-options: DENY`,
`cross-origin-opener-policy: same-origin`, a tight `referrer-policy` and a
deny-all `permissions-policy`. The page sets no cookies. Keep it that way: no
CDN assets, no fonts, no trackers. The request API streams the body and aborts
past 4096 chars; bearer auth is a constant-time byte compare.

## Pages

`/` (one-pager), `/sample-report`, `/privacy`, `/terms`, plus `app/robots.ts`
and `app/sitemap.ts` (no static `public/robots.txt`/`sitemap.xml` — those are
generated).

## Custom domain

All canonical URLs live in code, not static files: `app/layout.tsx`
(metadataBase, OG), `app/sitemap.ts`, `app/robots.ts`. Update those,
redeploy (`railway up --detach`), and check the CSP header still lands.

`parity-check.sh` runs the local status/header checks against `npm start`
(untracked, never deployed).
