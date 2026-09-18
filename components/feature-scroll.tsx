"use client";

import { useEffect, useRef, useState } from "react";
import { MARK_DOTS } from "./logo-mark";

/* Pinned feature walkthrough. Left: heading first, then one step at a time
   on a rail (done steps stack at the top, upcoming at the bottom). Right: an
   isometric stack of four plates on a dotted grid; the active step's plate
   moves to the middle and its callouts appear. Every position is a CSS class
   keyed off data-s (nonce CSP: no style attributes). Narrow screens and
   reduced motion get a plain stacked list (CSS media rules). */

type Callout = { lines: string[]; x: number; y: number; side: "l" | "r"; leader: string };
type Step = { label: string; word: string; line: string; callouts: Callout[]; cta?: boolean };

const STEPS: Step[] = [
  {
    label: "WHERE THEY WALK OUT",
    word: "Watch",
    line: "Analytics show where people drop. Leakdown shows why. Ten prospects drive a real browser, think out loud, and say the moment they give up.",
    callouts: [
      { lines: ["THINKS", "ALOUD"], x: 150, y: 292, side: "l", leader: "236,300 300,338 300,470" },
      { lines: ["VIDEO OF", "EVERY RUN"], x: 574, y: 322, side: "r", leader: "556,330 500,366 500,440" },
    ],
  },
  {
    label: "AGENTS AT THE DOOR",
    word: "Unblock",
    line: "AI agents now sign up for things. A CAPTCHA, an SSO-only gate or an unlabeled button stops them, and you never hear about it. We hit those walls first.",
    callouts: [
      { lines: ["CAPTCHA"], x: 150, y: 300, side: "l", leader: "250,296 312,334 312,470" },
      { lines: ["SSO-ONLY"], x: 574, y: 300, side: "r", leader: "556,296 470,346 470,430" },
      { lines: ["UNLABELED", "BUTTONS"], x: 632, y: 420, side: "r", leader: "614,428 566,456 566,486" },
    ],
  },
  {
    label: "EVERY DEPLOY",
    word: "Guard",
    line: "A deploy can break signup and nobody writes in. Run one goal in CI and get a pass or fail before a customer finds it.",
    callouts: [
      { lines: ["--GOAL"], x: 150, y: 300, side: "l", leader: "232,296 300,338 300,470" },
      { lines: ["EXIT 0 / 1"], x: 574, y: 318, side: "r", leader: "556,314 510,344 510,470" },
    ],
  },
  {
    label: "WHAT TO FIX FIRST",
    word: "Fix",
    line: "One number, the three pages people left from, and an expert fix for each, with steps to check it yourself.",
    callouts: [
      { lines: ["FIX", "FIRST"], x: 150, y: 292, side: "l", leader: "208,300 300,354 300,470" },
      { lines: ["CHECK IT", "YOURSELF"], x: 574, y: 322, side: "r", leader: "556,330 500,366 500,452" },
    ],
    cta: true,
  },
];

const INTRO_END = 0.1;

/* one plate, drawn around (0,0); `flat` children use a 0..100 square that the
   matrix lays onto the top face (u → right-down edge, v → left-down edge) */
const FACE = "0,-133 230,0 0,133 -230,0";
const SIDE_L = "-230,0 0,133 0,149 -230,16";
const SIDE_R = "230,0 0,133 0,149 230,16";
const FLAT = "matrix(2.3 1.33 -2.3 1.33 0 -133)";

function Plate({ children }: { children: React.ReactNode }) {
  return (
    <g transform="translate(400 0)">
      <polygon className="pl-side" points={SIDE_L} />
      <polygon className="pl-side" points={SIDE_R} />
      <polygon className="pl-face" points={FACE} />
      <g transform={FLAT}>{children}</g>
    </g>
  );
}

const hatch = (x: number, y: number, w: number, h: number, gap = 3) =>
  Array.from({ length: Math.floor(w / gap) }, (_, i) => (
    <line key={i} className="pl-thin" x1={x + i * gap + 1} y1={y} x2={x + i * gap + 1} y2={y + h} />
  ));

const LAYERS = [
  // 0 · your site, in a real browser
  <Plate key="site">
    <rect className="pl-line" x="5" y="5" width="90" height="90" />
    <rect className="pl-fill" x="9" y="9" width="82" height="9" />
    <text className="pl-text" x="11" y="15.5">YOUR-SITE.COM</text>
    {[0, 1, 2].map((i) => (
      <rect key={i} className="pl-line" x={56 + i * 12} y="11" width="9" height="5" />
    ))}
    <rect className="pl-line" x="9" y="22" width="24" height="69" />
    {hatch(10, 23, 22, 67)}
    <rect className="pl-fill" x="37" y="22" width="54" height="34" />
    <rect className="pl-line" x="37" y="60" width="25" height="31" />
    <rect className="pl-line" x="66" y="60" width="25" height="31" />
    <circle className="pl-cursor" cx="74" cy="72" r="2.2" />
  </Plate>,
  // 1 · the walls an agent hits
  <Plate key="walls">
    <text className="pl-text" x="8" y="10">AGENT · BOT WALLS</text>
    {Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => (
        <path key={`${r}-${c}`} className="pl-thin" d={`M${52 + c * 8 - 1.5},${50 + r * 9}h3M${52 + c * 8},${48.5 + r * 9}v3`} />
      )),
    )}
    <rect className="pl-fill" x="8" y="16" width="38" height="26" />
    <text className="pl-text is-inv" x="12" y="30">CAPTCHA</text>
    <rect className="pl-line" x="52" y="16" width="38" height="12" />
    <text className="pl-text" x="55" y="24">SSO ONLY</text>
    <rect className="pl-line" x="8" y="48" width="38" height="10" />
    <rect className="pl-line" x="8" y="62" width="38" height="10" />
    <rect className="pl-line is-dash" x="8" y="76" width="38" height="10" />
    <text className="pl-text" x="11" y="83">[ ? ]</text>
  </Plate>,
  // 2 · every deploy, in CI
  <Plate key="ci">
    <text className="pl-text" x="8" y="12">RUN:GOAL</text>
    {[
      [8, 20, 46],
      [14, 28, 60],
      [14, 36, 38],
      [20, 44, 52],
      [20, 52, 30],
      [14, 60, 64],
      [8, 68, 40],
    ].map(([x, y, w], i) => (
      <rect key={i} className="pl-bar" x={x} y={y} width={w} height="4" rx="2" />
    ))}
    <rect className="pl-line" x="62" y="78" width="30" height="12" />
    <text className="pl-text" x="66" y="86">EXIT 0 ✓</text>
  </Plate>,
  // 3 · the report, signed with the mark
  <Plate key="report">
    <g className="pl-mark" transform="translate(8 5) scale(0.13)">
      {MARK_DOTS.map((d) => (
        <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.r} />
      ))}
    </g>
    <text className="pl-text" x="21" y="11">LEAKDOWN</text>
    <text className="pl-text" x="21" y="17">AGGREGATE.md</text>
    <line className="pl-thin" x1="8" y1="24" x2="92" y2="24" />
    <text className="pl-num" x="8" y="40">3/10</text>
    <text className="pl-text" x="38" y="34">STALLED AT</text>
    <text className="pl-text" x="38" y="40">SIGNUP STEP 2</text>
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <circle className="pl-dot" cx="10" cy={53 + i * 10} r="1.6" />
        <rect className="pl-bar" x="15" y={51 + i * 10} width={46 - i * 9} height="4" rx="2" />
        <rect className="pl-line" x="72" y={50 + i * 10} width="20" height="6" />
        <text className="pl-text" x="74" y={54.5 + i * 10}>{["3/10", "2/10", "2/10"][i]}</text>
      </g>
    ))}
    <rect className="pl-tag" x="8" y="84" width="84" height="9" />
    <rect className="pl-line" x="8" y="84" width="84" height="9" />
    <text className="pl-text" x="11" y="90">FIX FIRST → PLAN PICKER</text>
  </Plate>,
];

export default function FeatureScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(-1);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      const next = p < INTRO_END ? -1 : Math.min(STEPS.length - 1, Math.floor(((p - INTRO_END) / (1 - INTRO_END)) * STEPS.length));
      setS((cur) => (cur === next ? cur : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const state = s < 0 ? "i" : String(s);
  const stateOf = (i: number) => (s < 0 ? "is-below" : i < s ? "is-above" : i === s ? "is-active" : "is-below");

  return (
    <div className="fs-wrap" ref={wrapRef} data-s={state}>
      <div className="fs-pin">
        <div className="fs-left">
          <div className="fs-rail" aria-hidden="true">
            <i />
          </div>
          <div className="fs-intro">
            <h2>Find the leak before it costs you a customer.</h2>
            <p>
              Leakdown sends prospects and AI agents through your site in a real browser, and tells
              you exactly where they got stuck.
            </p>
          </div>
          <ol className="fs-list">
            {STEPS.map((st, i) => (
              <li className={`fs-item ${stateOf(i)}`} key={st.label}>
                <span className="fs-dot" aria-hidden="true" />
                <div className="fs-row">
                  <span className="fs-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="fs-label">{st.label}</span>
                </div>
                <div className="fs-body">
                  <div>
                    <h3 className="fs-word">{st.word}</h3>
                    <p className="fs-line">{st.line}</p>
                    {st.cta && (
                      <a className="fs-btn" href="#request" data-open="request" aria-haspopup="dialog">
                        Request a run
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="fs-right" aria-hidden="true">
          <svg className="fs-art" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet">
            {/* lower plates first, so upper plates paint over them */}
            {LAYERS.map((layer, i) => ({ layer, i }))
              .reverse()
              .map(({ layer, i }) => (
                <g className={`ly ly-${i}`} key={i}>
                  {layer}
                </g>
              ))}
            {STEPS.map((st, i) =>
              st.callouts.map((c) => (
                <g className={`co co-${i}`} key={`${i}-${c.lines[0]}`}>
                  <polyline className="co-lead" points={c.leader} />
                  <circle className="co-dot" cx={c.side === "l" ? c.x - 14 : c.x - 14} cy={c.y - 5} r="4" />
                  {c.lines.map((l, k) => (
                    <text className="co-text" key={l} x={c.x} y={c.y + k * 22}>
                      {l}
                    </text>
                  ))}
                </g>
              )),
            )}
          </svg>
        </div>

        <div className="fs-strip">
          <span className="fs-strip-step">
            {s < 0 ? "FOUR CHECKS · ONE RUN" : `STEP ${String(s + 1).padStart(2, "0")} / ${String(STEPS.length).padStart(2, "0")}`}
          </span>
          <a className="fs-strip-cta" href="#request" data-open="request" aria-haspopup="dialog">
            REQUEST A RUN &gt;&gt;&gt;
          </a>
        </div>
      </div>
    </div>
  );
}
