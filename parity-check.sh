#!/bin/bash
# 03-03 local parity check — UNTRACKED, never deployed. Run against `npm start` on $PORT.
BASE=${BASE:-http://localhost:3000}
pass=0; fail=0
chk() { # chk <label> <want-code> <curl-args...>
  local label="$1" want="$2"; shift 2
  local got
  got=$(curl -s -o /dev/null -w "%{http_code}" "$@")
  if [ "$got" = "$want" ]; then pass=$((pass+1)); echo "PASS $label -> $got";
  else fail=$((fail+1)); echo "FAIL $label -> got $got want $want"; fi
}
echo "== base: $BASE"
echo "--- 1. front page (want 200)";            chk "GET /" 200 "$BASE/"
echo "--- 2. probe, no auth (want 404 page when bucket off)"
curl -s -w "\n%{http_code}\n" "$BASE/orders" | tail -2
echo "--- 2b. probe /api path (want 404 when off)"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/orders"
echo "--- 3. POST /request, env off (want 404 fallthrough)"
chk "POST /request off" 404 -X POST "$BASE/request" -H 'content-type: application/json' -d '{"url":"https://example.com","email":"you@company.com","consent":true}'
chk "POST /api/request off" 404 -X POST "$BASE/api/request" -H 'content-type: application/json' -d '{"url":"https://example.com","email":"you@company.com","consent":true}'
echo "--- 8. headers on / (want CSP + no set-cookie)"
curl -sI "$BASE/" | grep -i -E '^(content-security-policy|x-content-type-options|referrer-policy|permissions-policy|strict-transport-security|set-cookie)'
echo "--- 8b. headers on API 404 (want CSP + no set-cookie)"
curl -si "$BASE/api/orders" | grep -i -E '^(content-security-policy|set-cookie|HTTP/)'
echo "--- 12. operator list, no auth (want 404 when off, 401 when live)"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/orders"
echo "--- 13. bad id charset (want 404)";       chk "GET /orders/bad!id" 404 "$BASE/orders/bad!id"
chk "GET /api/orders/bad!id" 404 "$BASE/api/orders/bad!id"
chk "POST /orders/bad!id" 404 -X POST "$BASE/orders/bad!id" -H 'content-type: application/json' -d '{}'
echo "== pass=$pass fail=$fail"
