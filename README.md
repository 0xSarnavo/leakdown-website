# client-simulator — site

One page, plain HTML/CSS/JS, served by `server.mjs` (zero dependencies). The
same server takes run requests: `POST /request` stores one JSON object per
order in a private Railway bucket; `GET /orders` and `POST /orders/:id` sit
behind `ORDERS_TOKEN`. Nothing runs here; the operator fulfils orders from
their laptop with `client-simulator --orders` / `--order <id>`.

```bash
node server.mjs            # http://localhost:3000
railway up --detach        # deploy from this folder
```

Bucket and token come from the Railway service's variables (BUCKET,
ACCESS_KEY_ID, SECRET_ACCESS_KEY, ENDPOINT, REGION, ORDERS_TOKEN). Without them
the form stays hidden and the page says requests are closed.
