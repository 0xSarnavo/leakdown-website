/**
 * Server half of the human check — the canonical siteverify contract.
 *
 * Three things must hold, not one: Cloudflare says the token is good, it was
 * minted for THIS surface (`action`), and it came from a hostname this
 * deployment serves (`TURNSTILE_HOSTNAMES`). Without the last two a token
 * harvested from the waitlist widget, or from a copy of the page hosted
 * elsewhere, would spend fine here.
 *
 * Unconfigured is a working state: with no `TURNSTILE_SECRET` the check is
 * skipped, so a fork or a local copy runs without a Cloudflare account. Once
 * the secret is set the check fails CLOSED — a token that cannot be verified is
 * not a token, and the daily ceiling is no reason to accept an unverified one.
 *
 * Tokens are single-use and expire after five minutes; the widget is reset
 * after every submit so a retry mints a fresh one.
 */
const SECRET = process.env.TURNSTILE_SECRET;
const VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare's published testing keys. They answer with action "test" on any host. */
const DUMMY_SECRET = /^[123]x0{10}/;

const hostnames = new Set(
  (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
);

export const turnstileOn = (): boolean => Boolean(SECRET);

export async function human(token: unknown, action: string, ip: string): Promise<boolean> {
  if (!SECRET) return true;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  let result: { success?: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
  try {
    const body = new URLSearchParams({ secret: SECRET, response: token });
    if (ip && ip !== "?") body.set("remoteip", ip);
    const r = await fetch(VERIFY, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    result = await r.json();
  } catch (e) {
    console.error(`turnstile siteverify failed — ${(e as Error).message}`);
    return false;
  }

  if (!result.success) {
    console.warn(`turnstile rejected: ${(result["error-codes"] ?? []).join(",")}`);
    return false;
  }
  // the testing keys answer action "test" from any host, which is the point of them
  if (DUMMY_SECRET.test(SECRET)) return true;
  if (result.action !== action) {
    console.warn(`turnstile action mismatch: got ${result.action}, expected ${action}`);
    return false;
  }
  if (hostnames.size === 0 || !result.hostname || !hostnames.has(result.hostname)) {
    console.warn(`turnstile hostname not allowed: ${result.hostname}`);
    return false;
  }
  return true;
}
