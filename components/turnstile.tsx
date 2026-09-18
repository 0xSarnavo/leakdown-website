"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cloudflare's human check, on the two forms that write to the bucket.
 *
 * Rendered explicitly, not implicitly, because both forms stay on the page
 * after submitting: a token is redeemed exactly once, so the widget has to be
 * reset before a second attempt or the retry fails with "timeout-or-duplicate".
 * Each surface keeps its own widget id for that reason.
 *
 * The sitekey is public by design — it identifies the widget and reads nothing
 * back — so it ships in the bundle, with the env var winning when set, the same
 * arrangement the analytics key uses. It is the only third-party script on the
 * site; `proxy.ts` names that one origin and nothing wider.
 */
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const FALLBACK_KEY = "0x4AAAAAAE8Dwm0PIzHvQ0Rx";
/** Hosts the built-in widget is registered for; a fork elsewhere must bring its own. */
const OUR_HOSTS = new Set(["leakdown.dev", "www.leakdown.dev", "localhost", "127.0.0.1"]);

/**
 * The widget to render, or null when there is none to render.
 *
 * A fork that deploys this code unchanged would otherwise load OUR widget and
 * mint tokens their secret cannot verify — every submission a 403 they cannot
 * debug. So the built-in key is used only on the hosts it is registered for;
 * anywhere else, set NEXT_PUBLIC_TURNSTILE_SITE_KEY or run without the check.
 */
export function siteKey(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (fromEnv) return fromEnv;
  if (typeof window === "undefined") return FALLBACK_KEY; // SSR: decided again on mount
  return OUR_HOSTS.has(window.location.hostname) ? FALLBACK_KEY : null;
}

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  getResponse: (id: string) => string | undefined;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Resolves once the widget script has run; one script tag for the whole page. */
function loadTurnstile(): Promise<TurnstileApi | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!document.querySelector(`script[src="${SRC}"]`)) {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (window.turnstile) return resolve(window.turnstile);
      if (Date.now() - started > 15_000) return resolve(null); // blocked or offline: the server still decides
      setTimeout(tick, 100);
    };
    tick();
  });
}

/**
 * One widget for one protected surface. `action` names that surface and is
 * checked again on the server, so a token minted for the waitlist cannot be
 * spent on a run request.
 */
export function useTurnstile(action: string) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  /** null while loading, true once rendered, false when the script never arrived */
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const key = siteKey();
    if (!key) {
      setReady(true); // no widget here by design; the server is not checking either
      return;
    }
    void loadTurnstile().then((api) => {
      if (cancelled) return;
      if (!api || !ref.current) {
        setReady(false); // blocked, offline, or too slow — the form must say so
        return;
      }
      if (!id.current) {
        id.current = api.render(ref.current, {
          sitekey: key,
          action,
          appearance: "interaction-only",
          theme: "auto",
        });
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [action]);

  /** The token for this attempt, or "" when the widget never ran. */
  const token = useCallback(() => {
    if (!id.current || !window.turnstile) return "";
    return window.turnstile.getResponse(id.current) ?? "";
  }, []);

  /** Call after every submit: the token just used cannot be used again. */
  const reset = useCallback(() => {
    if (id.current && window.turnstile) window.turnstile.reset(id.current);
  }, []);

  return { ref, token, reset, ready };
}

export default function Turnstile({ innerRef }: { innerRef: React.RefObject<HTMLDivElement | null> }) {
  return <div className="cf-turnstile" ref={innerRef} />;
}
