/* Leakdown mark: a teardrop made of halftone dots, the same drop as the hero.
   Dot size follows a light from the top left. The drop itself stays still; a
   drip gathers at its base, necks, and falls away. Hover
   glitches the rows, click (nav) bursts them. All CSS (.lm-*); still under
   reduced motion.

   The geometry lives in lib/mark.ts, not here. It used to live in both places,
   and app/icon.svg drifted to 55 dots while this rendered 69 — the favicon and
   the logo were the same mark only by accident, until they weren't. */

import { DROP_R, MARK_BOX, MARK_DOTS, type Dot } from "../lib/mark";

export type { Dot };
export { MARK_BOX, MARK_DOTS };

export default function LogoMark({ className, animate = true }: { className?: string; animate?: boolean }) {
  return (
    <svg
      className={`${className ?? ""}${animate ? " lm-live" : ""}`}
      viewBox={`0 0 ${MARK_BOX.w} ${MARK_BOX.h}`}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <g className="lm-body">
          {MARK_DOTS.map((d) => (
            <circle
              key={`${d.x}-${d.y}`}
              className={`lm-row lm-r${d.row}${d.row % 2 ? " lm-odd" : ""}`}
              cx={d.x}
              cy={d.y}
              r={d.r}
            />
          ))}
        </g>
        {animate && (
          <circle className="lm-drop" cx={MARK_BOX.dripX} cy={MARK_BOX.dripY} r={DROP_R} />
        )}
      </g>
    </svg>
  );
}
