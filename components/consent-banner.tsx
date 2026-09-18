"use client";

import { useEffect, useState } from "react";
import { dnt, getConsent, setConsent } from "./consent";

/**
 * The question, asked once, before anything is set.
 *
 * It renders only when there is no stored answer and Do Not Track is off, and
 * only on the live hosts — a preview or a local copy never tracks, so there is
 * nothing to ask about. It arrives in the middle of the screen, says the whole
 * thing in three lines, and both answers are one click of the same weight; the
 * choice can be changed later from the privacy page.
 */
const HOSTS = new Set(["docs.leakdown.dev", "www.leakdown.dev", "leakdown.dev"]);

export default function ConsentBanner() {
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if (!HOSTS.has(window.location.hostname) || dnt()) return;
    setAsk(getConsent() === null);
    const onChange = () => setAsk(getConsent() === null);
    window.addEventListener("ld-consent", onChange);
    return () => window.removeEventListener("ld-consent", onChange);
  }, []);

  if (!ask) return null;

  return (
    <div className="consent-pop" role="region" aria-label="Analytics choice">
      <div className="consent-card">
        <p className="consent-k">Analytics</p>
        <p>
          Our own analytics — page views, clicks and session replays of this site — show which parts
          people use, and set a cookie. Nothing loads until you choose, and the site we test for you
          is never tracked. <a href="/privacy">What we collect</a>.
        </p>
        <div className="consent-actions">
          <button type="button" className="btn" onClick={() => setConsent("granted")}>
            Allow
          </button>
          <button type="button" className="btn ghost" onClick={() => setConsent("denied")}>
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
