"use client";

import { useEffect, useRef } from "react";

/* Alpha note: one large statement whose words light up in reading order as
   the band scrolls through the screen (no pin, so the page stays short).
   Accent words light up purple. Word opacity is set through the CSSOM (the
   nonce CSP allows that, not style attributes). Reduced motion shows it lit. */

type W = { t: string; a?: boolean };

const TEXT: W[] = [
  ..."Leakdown is in".split(" ").map((t) => ({ t })),
  { t: "alpha.", a: true },
  ..."A simulated prospect stalling is a".split(" ").map((t) => ({ t })),
  { t: "signal,", a: true },
  ..."not a measurement of your traffic. Every finding carries its count, and under three sessions it says".split(" ").map((t) => ({ t })),
  { t: "too", a: true },
  { t: "few", a: true },
  { t: "to", a: true },
  { t: "call.", a: true },
  ..."Check it on your own page before you ship a fix.".split(" ").map((t) => ({ t })),
];

export default function AlphaNote() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".an-w"));
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }
    if (reduced) {
      words.forEach((w) => w.style.setProperty("opacity", "1"));
      return;
    }
    let raf = 0;
    let last = -1;
    const paint = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // lit from when the text enters the lower fifth until it reaches the upper third
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      const n = words.length;
      words.forEach((w, i) => {
        const k = Math.min(1, Math.max(0, p * n * 1.08 - i));
        w.style.setProperty("opacity", (0.16 + 0.84 * k).toFixed(3));
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="an" ref={ref}>
      <p className="an-text">
        {TEXT.map((w, i) => (
          <span key={i}>
            <span className={w.a ? "an-w is-a" : "an-w"}>{w.t}</span>{" "}
          </span>
        ))}
      </p>
    </div>
  );
}
