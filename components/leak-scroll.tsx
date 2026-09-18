"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* Pinned, scroll-driven run readout. The panel sticks under the nav while the
   wrapper scrolls ~1.6 screens; scroll progress prints the run log and raises
   one bar per leak out of a slash field. Everything is drawn in an SVG whose
   viewBox matches its pixel size, so strokes and labels stay crisp at any
   width. Labels come from the sample report (nothing invented); the orange bar
   is a single-session finding, which the tool re-runs before it counts it.
   No style attributes anywhere (nonce CSP): geometry lives in SVG attributes.
   Reduced motion: no pin, finished state. */

type Leak = { n: string; text: string; short: string; xNarrow: number; tone: "blue" | "warn"; log: string; time: string };

// narrow screens keep fixed columns, each a row higher; wide screens run a conveyor
const LEAKS: Leak[] = [
  { n: "3", text: "STALLED AT SIGNUP STEP 2", short: "STALLED AT SIGNUP", xNarrow: 0.04, tone: "blue", time: "10:22:18", log: "LEAK SIGNUP_STEP_2 3/10" },
  { n: "2", text: "HIT A 404 ON PRICING", short: "404 ON PRICING", xNarrow: 0.28, tone: "blue", time: "10:27:40", log: "LEAK PRICING_404 2/10" },
  { n: "1", text: "AGENT BLOCKED · NEEDS 2ND RUN", short: "AGENT BLOCKED · RE-RUN", xNarrow: 0.52, tone: "warn", time: "10:33:05", log: "SINGLE AGENT_BLOCKED 1/10" },
  { n: "2", text: "LOST AFTER GOOGLE SIGN-IN", short: "LOST AFTER GOOGLE", xNarrow: 0.76, tone: "blue", time: "10:38:51", log: "LEAK GOOGLE_SIGN_IN 2/10" },
];
const RISE_AT = (i: number) => 0.14 + i * 0.19; // progress at which leak i starts rising

// run log: each line prints at its progress mark; leak lines print with their bar
const LOG: Array<{ at: number; time: string; label: string }> = [
  { at: 0, time: "10:14:02", label: "RUN_STARTED" },
  { at: 0.03, time: "10:14:31", label: "SITE_READ" },
  { at: 0.06, time: "10:15:47", label: "MAP_BUILT" },
  { at: 0.09, time: "10:16:05", label: "PROSPECTS_SENT" },
  ...LEAKS.map((l, i) => ({ at: RISE_AT(i), time: l.time, label: l.log })),
  { at: 0.9, time: "10:41:12", label: "FILTER_CITED_2+" },
  { at: 0.97, time: "10:52:40", label: "REPORT_WRITTEN" },
];
const LOG_TAIL = 6; // show the last lines only, like tail -f

const STEP = 28; // tooth spacing, px
const LIP = 26; // short vertical at the top of each tooth, px
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

export default function LeakScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 620 });
  const [p, setP] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const field = fieldRef.current;
    if (!wrap || !field) return;

    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(field);

    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }
    if (reduced) {
      setStill(true);
      setP(1);
      return () => ro.disconnect();
    }

    let raf = 0;
    let last = -1;
    const read = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      // start a touch early so the first line is already printed when the panel pins
      const next = span > 0 ? clamp((-r.top + window.innerHeight * 0.15) / span) : 1;
      const q = Math.round(next * 500) / 500;
      if (q !== last) {
        last = q;
        setP(q);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const { w, h } = size;
  const narrow = w < 900; // under 900 the log would sit on top of the tags
  const fieldTop = Math.round(h * (narrow ? 0.66 : 0.56));
  const fieldH = h - fieldTop;
  const dx = Math.round(fieldH * 0.5);

  // wide: the field slides left as you scroll; bars rise near the right edge and ride along
  const travel = narrow ? 0 : w * 0.5;
  const offset = p * travel;
  const shift = offset % STEP;
  const teeth = useMemo(() => {
    let d = "";
    const x0 = -Math.ceil(dx / STEP) * STEP - shift;
    for (let x = x0; x <= w; x += STEP) {
      d += `M${x},${fieldTop + LIP}V${fieldTop}L${x + dx},${fieldTop + dx}V${h}`;
    }
    return d;
  }, [w, h, fieldTop, dx, shift]);

  const fs = narrow ? 10 : 13;
  const lh = fs + 14;
  const shapes = LEAKS.map((leak, i) => {
    const at = RISE_AT(i);
    const k = easeOut(clamp((p - at) / 0.14));
    // world position = where the conveyor has carried the spawn point when this leak rises
    const world = Math.round((w * 0.84 + at * travel) / STEP) * STEP;
    const xb = narrow ? Math.round((leak.xNarrow * w) / STEP) * STEP : world - offset;
    // desktop: alternate heights far enough apart that neighbouring tags never touch;
    // narrow: each bar a full tag-row higher than the one to its left
    const rise = narrow ? 24 + i * (lh + 10) : fieldH * 0.4 + (i % 2 ? 72 : 0);
    const y0 = fieldTop - rise * k;
    const yb = fieldTop + LIP;
    const inner = xb + dx - STEP;
    const bar = [
      `${xb},${y0}`,
      `${xb + dx},${y0 + dx}`,
      `${xb + dx},${h}`,
      `${inner},${h}`,
      `${inner},${yb + dx - STEP}`,
      `${xb},${yb}`,
    ].join(" ");
    const text = `${leak.n} ${narrow ? leak.short : leak.text}`;
    const lw = Math.round(text.length * fs * 0.66 + fs * 2.8);
    const lx = Math.max(4, Math.min(xb, w - lw - 4));
    const ly = Math.max(4, y0 - 34 - lh);
    return { key: leak.text, k, xb, y0, bar, text, lw, lx, ly, warn: leak.tone === "warn" };
  });

  const printed = LOG.filter((l) => p >= l.at);
  const tail = printed.slice(-LOG_TAIL);
  const prospects = String(Math.min(10, 1 + Math.floor(p * 10))).padStart(3, "0");

  return (
    <div className={still ? "lk-wrap is-still" : "lk-wrap"} ref={wrapRef}>
      <div className="lk-pin">
        <div className="lk-log" aria-hidden="true">
          <div className="lk-head">
            <span>{prospects} / 010 PROSPECTS</span>
            <span>&gt;&gt;&gt;</span>
          </div>
          {tail.map((l) => (
            <div className={l.label.startsWith("SINGLE") ? "lk-row is-leak is-warn" : l.label.startsWith("LEAK") ? "lk-row is-leak" : "lk-row"} key={l.time}>
              <span>[{l.time}]</span>
              <span className="lk-lead" />
              <span>{l.label}</span>
            </div>
          ))}
          <div className="lk-row lk-state">{p < 1 ? "PROCESSING.." : "DONE · AGGREGATE.md"}</div>
        </div>

        <div className="lk-field" ref={fieldRef}>
          <svg
            className="lk-svg"
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
            role="img"
            aria-label="Sample run: 3 prospects stalled at signup step 2, 2 hit a 404 on pricing, 2 were lost after Google sign-in, and 1 agent was blocked and needs a second run."
          >
            <rect className="lk-ground" x="0" y={fieldTop} width={w} height={fieldH} />
            <path className="lk-teeth" d={teeth} />
            {shapes.map((g) => (
              <g key={g.key} opacity={g.k}>
                <polygon className="lk-bar" points={g.bar} />
                <line className="lk-link" x1={g.xb} y1={g.ly + lh} x2={g.xb} y2={g.y0} />
              </g>
            ))}
            {shapes.map((g) => (
              <g key={g.key} opacity={g.k}>
                <rect className="lk-tag" x={g.lx} y={g.ly} width={g.lw} height={lh} />
                <circle className={g.warn ? "lk-dot is-warn" : "lk-dot"} cx={g.lx + fs} cy={g.ly + lh / 2} r={fs * 0.28} />
                <text className="lk-text" x={g.lx + fs * 1.8} y={g.ly + lh / 2} fontSize={fs} dominantBaseline="central">
                  {g.text}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="lk-strip">
          <a className="lk-strip-title" href="/sample-report">
            SAMPLE RUN &gt;&gt;&gt;
          </a>
          <span className="lk-count">
            <i className="lk-dot-html" />
            <b>10</b>
            <span className="lk-lead" />
            PROSPECTS SENT
          </span>
          <span className="lk-count">
            <i className="lk-dot-html is-warn" />
            <b>3</b>
            <span className="lk-lead" />
            LEAKS CITED BY 2+
          </span>
        </div>
      </div>
    </div>
  );
}
