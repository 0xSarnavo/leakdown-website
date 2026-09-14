# Leakdown — site (Railway)

One page, plain HTML/CSS/JS, served by `server.mjs` (zero dependencies). The
same server takes alpha run requests: `POST /request` stores one JSON object
per order in a private Railway bucket; `GET /orders` and friends sit behind
`ORDERS_TOKEN`. Nothing runs here; the operator fulfils orders from their
laptop with `leakdown --orders` / `--order <id>`.

## Local

```bash
node server.mjs            # http://localhost:3000
```

## Deploy (Railway)

```bash
railway login
railway link               # pick the Leakdown project / website service
railway up --detach        # deploy from this folder
```

`railway.json` pins the Nixpacks builder and `node server.mjs` as the start
command, with `/` as the healthcheck path. The service listens on `$PORT`.

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

| Method | Path          | Auth | Behaviour                                                               |
| ------ | ------------- | ---- | ----------------------------------------------------------------------- |
| `POST` | `/request`    | no   | New alpha request `{url, email, consent:true}` → `201 {ok:true, id}`     |
| `GET`  | `/orders`     | yes  | New orders, oldest first; `?all=1` includes `done`/`rejected`            |
| `GET`  | `/orders/:id` | yes  | One order, or `404 {error:"no such order"}`                              |
| `POST` | `/orders/:id` | yes  | Set `{status: new\|done\|rejected, note?}` (note capped at 300 chars)    |

Auth is `Authorization: Bearer $ORDERS_TOKEN` (constant-time compare).

Validation on `POST /request`:

- `url` must be a full public `http(s)` URL — no bare IPs, no
  `.local`/`.internal`/`localhost`, no whitespace; truncated to 300 chars.
- `email` must look like an email, max 120 chars (lowercased).
- `consent` must be `true` (the "I own this site" checkbox).
- One request per email per day (a repeat overwrites while still `new`; a
  handled order answers `429`).
- Rate limit: 10 requests/min per IP (first entry of `x-forwarded-for`).

The front page probes `GET /orders` on load: a `401` means the bucket and
token are live, so it unhides the request form; anything else leaves the
"closed" note up.

Status enum: `new` → `done` | `rejected`.

## Security headers

Every response carries a strict `content-security-policy` (`default-src
'self'`, no inline script/style, no third-party scripts, no external fonts,
no analytics), plus `strict-transport-security` (HSTS, 1 year),
`x-content-type-options: nosniff`, a tight `referrer-policy` and a deny-all
`permissions-policy`. The page sets no cookies. Keep it that way: no inline
`<script>`/`<style>`, no CDN assets, no fonts, no trackers.

## Custom domain

After pointing the domain at the Railway service:

1. Update the canonical link and `og:image`/`twitter:image` in
   `public/index.html` to the real domain.
2. Update the `Sitemap:` line in `public/robots.txt` and every `<loc>` in
   `public/sitemap.xml`.
3. Redeploy (`railway up --detach`) and check the CSP header still lands.
