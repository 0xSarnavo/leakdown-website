"use client";

import { useEffect, useRef } from "react";

/* Griffin-style scroll section: sticky layer-stack visual left, steps right,
   progress rail. IO advances .active (no scroll-jacking). Reduced-motion,
   no-IO, or mobile (<=900px): static stacked, all active, rail full. */
const STEPS = [
  {
    n: "01",
    h: "Read the site",
    p: "What it sells, to whom, where signup is. A crawler walks two clicks from the landing page plus the sitemap, with no AI.",
    ul: ["Lists pages nobody found", "Lists broken links first"],
  },
  {
    n: "02",
    h: "Build ten prospects",
    p: "Core customers, adjacent roles, and people outside the target, each fitted to the product. Each gets its own email address.",
    ul: ["Codes and links get used", "Nothing is guessed at"],
  },
  {
    n: "03",
    h: "Send them in",
    p: "Each prospect drives a real browser one viewport at a time and thinks aloud until it finishes, walks out, or runs out of patience.",
    ul: ["Every step is logged", "Every run is recorded"],
  },
  {
    n: "04",
    h: "Climb the ladder",
    p: "Cheap models vote. A filter keeps only what more than one session cites. A verifier reviews. A stronger model re-walks the hardest prospect.",
    ul: ["One voice never counts", "Hardest case gets a rewrite"],
  },
];

const ROWS: Array<[string, string]> = [
  ["map / pages + payment surfaces", "listed"],
  ["visit / prospects, one at a time", "queued"],
  ["filter / keep cited by 2+", "waiting"],
  ["report / AGGREGATE.md", "waiting"],
];

export default function HowSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll(".hstep"));
    const layers = Array.from(root.querySelectorAll(".layer"));
    const setActive = (n: number) => {
      steps.forEach((s, i) => s.classList.toggle("active", i <= n));
      layers.forEach((s, i) => s.classList.toggle("active", i <= Math.min(n, layers.length - 1)));
      if (railRef.current) railRef.current.style.height = ((n + 1) / steps.length) * 100 + "%";
    };
    let staticMode = false;
    try {
      staticMode =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        window.matchMedia("(max-width: 900px)").matches;
    } catch {
      staticMode = false;
    }
    if (staticMode || !("IntersectionObserver" in window) || steps.length === 0) {
      setActive(steps.length - 1);
      return;
    }
    setActive(0);
    const hio = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-step")) || 0);
        });
      },
      { threshold: 0.5, rootMargin: "-15% 0px -40% 0px" },
    );
    steps.forEach((s) => hio.observe(s));
    return () => hio.disconnect();
  }, []);

  return (
    <div className="how-grid cells cols-how" ref={rootRef}>
      <div className="cell how-left">
      <aside className="how-visual" aria-label="Layer stack visual" data-reveal>
        <div className="layer" data-layer="0">
          <b>YOUR SITE</b>your-site.com · staging or prod
        </div>
        <div className="layer" data-layer="1">
          <b>LEAKDOWN CLI</b>spawn of prospects · real browser
        </div>
        <div className="layer" data-layer="2">
          <b>REPORT</b>runs/&lt;site&gt;/AGGREGATE.md
        </div>
        <pre>$ leakdown your-site.com --ladder --yes --headless</pre>
        <div className="runmini" aria-hidden="true">
          {ROWS.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </aside>
      </div>
      <div className="cell steps">
        <div className="rail" aria-hidden="true">
          <i ref={railRef}></i>
        </div>
        {STEPS.map((s, i) => (
          <div className="hstep" data-step={i} key={s.n}>
            <div className="n">STEP {s.n}</div>
            <h3>{s.h}</h3>
            <p>{s.p}</p>
            <ul>
              {s.ul.map((li) => (
                <li key={li}>{li}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
