import { CONTACT, DOCS, REPO, ext } from "../lib/site";
import LogoMark, { MARK_BOX, MARK_DOTS } from "./logo-mark";

/* Footer: brand + links on top, a rule with the copyright, then the giant
   wordmark beside an isometric pair of blocks. The top block (the leak mark)
   lifts off and docks onto the base (prospects + agents) on a CSS loop; the
   base glows when they meet. No JS; reduced motion parks it docked. */

type Iso = { cx: number; cy: number; w: number; h: number; t: number };

const face = ({ cx, cy, w, h }: Iso) => `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
const left = ({ cx, cy, w, h, t }: Iso) => `${cx - w},${cy} ${cx},${cy + h} ${cx},${cy + h + t} ${cx - w},${cy + t}`;
const right = ({ cx, cy, w, h, t }: Iso) => `${cx + w},${cy} ${cx},${cy + h} ${cx},${cy + h + t} ${cx + w},${cy + t}`;
// lays a flat 0..100 square onto the top face
const flat = ({ cx, cy, w, h }: Iso) => `matrix(${w / 100} ${h / 100} ${-w / 100} ${h / 100} ${cx} ${cy - h})`;

const BASE: Iso = { cx: 160, cy: 200, w: 130, h: 75, t: 34 };
const TOP: Iso = { cx: 160, cy: 166, w: 130, h: 75, t: 34 };

function Blocks() {
  return (
    <svg className="ft-art" viewBox="0 0 320 330" aria-hidden="true">
      {/* ghost outline under the base */}
      <polygon className="ft-ghost" points={face({ ...BASE, cy: BASE.cy + BASE.t + 14 })} />

      {/* base: prospects + agents */}
      <g className="ft-base">
        <polygon className="ft-side" points={left(BASE)} />
        <polygon className="ft-side" points={right(BASE)} />
        <polygon className="ft-seam" points={`${BASE.cx - BASE.w},${BASE.cy + 2} ${BASE.cx},${BASE.cy + BASE.h + 2} ${BASE.cx + BASE.w},${BASE.cy + 2} ${BASE.cx + BASE.w},${BASE.cy + 10} ${BASE.cx},${BASE.cy + BASE.h + 10} ${BASE.cx - BASE.w},${BASE.cy + 10}`} />
        <polygon className="ft-face" points={face(BASE)} />
        <g transform={flat(BASE)}>
          {Array.from({ length: 5 }, (_, r) =>
            Array.from({ length: 5 }, (_, c) =>
              r === 2 && c === 2 ? null : (
                <rect key={`${r}${c}`} className="ft-chip" x={30 + c * 8.4} y={30 + r * 8.4} width="5.4" height="5.4" />
              ),
            ),
          )}
          <rect className="ft-core" x="45.8" y="45.8" width="8.4" height="8.4" />
          <text className="ft-label" x="12" y="93">[ PROSPECTS · AGENTS ]</text>
        </g>
      </g>

      {/* top: the leak mark, lifts and docks */}
      <g className="ft-top">
        <polygon className="ft-side is-lit" points={left(TOP)} />
        <polygon className="ft-side is-lit" points={right(TOP)} />
        <polygon className="ft-face" points={face(TOP)} />
        <g transform={flat(TOP)}>
          {[
            [9, 9],
            [91, 9],
            [9, 91],
            [91, 91],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} className="ft-screw" cx={x} cy={y} r="2.4" />
          ))}
          {/* the mark, laid flat: 8 x 10 grid squeezed into the face */}
          <g className="ft-drop" transform="translate(30 12) scale(0.5)">
{MARK_DOTS.map((d) => (
              <circle key={`${d.x}-${d.y}`} className="lm-row" cx={d.x} cy={d.y} r={d.r} />
            ))}
            <circle className="lm-fall" cx={MARK_BOX.dripX} cy={MARK_BOX.dripY} r="3.4" />
          </g>
        </g>
      </g>
    </svg>
  );
}

// one outline set: same 24 box, same stroke, so every icon reads the same size
const Icon = {
  github: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </>
  ),
  x: (
    <>
      <path d="M4 3.5h4.2L20 20.5h-4.2z" />
      <path d="M19.5 3.5 13.3 10.6M4.5 20.5l6.2-7.1" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
};

// tight square box per icon, so each fills the same 20px square
const VIEW: Record<keyof typeof Icon, string> = {
  github: "0.11 1.1 21.8 21.8",
  x: "2.6 2.6 18.8 18.8",
  linkedin: "1.1 0.6 21.8 21.8",
  mail: "1.1 1.1 21.8 21.8",
};

const SOCIAL: Array<[string, string, keyof typeof Icon]> = [
  ["GitHub", REPO, "github"],
  ["X", "https://x.com/0xSarnavo", "x"],
  ["LinkedIn", "https://www.linkedin.com/in/sarnavo/", "linkedin"],
  ["Email", `mailto:${CONTACT}`, "mail"],
];

const COLS: Array<[string, Array<[string, string]>]> = [
  [
    "Product",
    [
      ["Live run", "/#live"],
      ["Features", "/#features"],
      ["FAQ", "/#faq"],
      ["Sample report", "/sample-report"],
      ["Request a run", "/#request"],
    ],
  ],
  [
    "Open source",
    [
      ["CLI on GitHub", REPO],
      ["Docs", DOCS],
      ["Changelog", `${DOCS}/changelog`],
      ["MIT license", `${REPO}/blob/main/LICENSE`],
    ],
  ],
  [
    "Legal",
    [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Contact", `mailto:${CONTACT}`],
    ],
  ],
];

export default function SiteFooter() {
  return (
    <footer className="site">
      <div className="ft-top-row">
        <div className="ft-brand">
          <a className="ft-logo" href="/#top">
            <LogoMark className="logo-mark" />
            Leakdown
          </a>
          <p className="ft-tag">Find where your signup leaks, before your customers do.</p>
          <div className="ft-social">
            {SOCIAL.map(([label, href, icon]) => (
              <a key={label} href={href} {...ext(href)} aria-label={label}>
                <svg viewBox={VIEW[icon]} aria-hidden="true">
                  {Icon[icon]}
                </svg>
              </a>
            ))}
          </div>
          <p className="ft-copy">© 2026 Leakdown. All rights reserved.</p>
        </div>
        {COLS.map(([title, links]) => (
          <nav className="ft-col" aria-label={title} key={title} data-reveal>
            <b>{title}</b>
            {links.map(([label, href]) => (
              <a
                key={label}
                href={href}
                {...ext(href)}
                {...(href === "/#request" ? { "data-open": "request", "aria-haspopup": "dialog" as const } : {})}
              >
                {label}
              </a>
            ))}
          </nav>
        ))}
      </div>

      <div className="ft-bottom">
        <div className="ft-art-wrap">
          <div className="ft-glow" aria-hidden="true" />
          <Blocks />
        </div>
        <div className="ft-mark" aria-hidden="true">
          Leakdown
        </div>
      </div>
    </footer>
  );
}
