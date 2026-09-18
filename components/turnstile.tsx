"use client";

import { useCallback, useEffect, useRef } from "react";

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
export const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAE8Dwm0PIzHvQ0Rx";

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

  useEffect(() => {
    let cancelled = false;
    void loadTurnstile().then((api) => {
      if (cancelled || !api || !ref.current || id.current) return;
      id.current = api.render(ref.current, {
        sitekey: SITE_KEY,
        action,
        appearance: "interaction-only",
        theme: "auto",
      });
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

  return { ref, token, reset };
}

export default function Turnstile({ innerRef }: { innerRef: React.RefObject<HTMLDivElement | null> }) {
  return <div className="cf-turnstile" ref={innerRef} />;
}
