import type { Metadata } from "next";
import { EXT, REPO } from "../lib/site";
import AsciiCanvas from "../components/ascii-canvas";

export const metadata: Metadata = {
  title: "Not found — Leakdown",
  description: "We can't find the page you are looking for.",
};

/* Fixed full-screen 404: the hero's slash field fills the screen, its glow
   rides a ring around a dark circle that holds the numerals and the copy. */
const NF_WORDS = [
  "NOT FOUND", "404", "DEAD END", "NO ROUTE", "MOVED", "REMOVED", "BROKEN LINK",
  "LOST", "WALKED OUT", "GO HOME", "TRY AGAIN", "SITEMAP", "LEAK", "CHECK IT",
];

export default function NotFound() {
  return (
    <main className="void">
      <section id="missing" aria-label="Page not found">
        <div className="nf-bg" aria-hidden="true">
          <div className="nf-canvas">
            <AsciiCanvas dark ring words={NF_WORDS} />
          </div>
          <div className="nf-void" />
        </div>
        <div className="nf-stack">
          <h1 className="visually-hidden">404</h1>
          <svg
            className="nf-404"
            viewBox="68 22 184 88"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <text x="160" y="106" textAnchor="middle" fontSize="108">
              <tspan vectorEffect="non-scaling-stroke" paintOrder="stroke fill">
                404
              </tspan>
            </text>
          </svg>
          <p className="nf-sub">
            We can&apos;t find the page you are looking for. It may have been removed, moved, or
            no longer exists.
          </p>
          <div className="nf-ctas">
            <a className="nf-btn nf-btn-blue" href="/">
              Take Me Home
            </a>
            <a className="nf-btn nf-btn-glass" href={REPO} {...EXT}>
              View Documentation
            </a>
          </div>
          <p className="nf-tiny">
            Looking for a specific page? Browse the <a href="/sitemap.xml">sitemap</a>, the{" "}
            <a href="/sample-report">sample report</a>, or <a href="/#request" data-open="request" aria-haspopup="dialog">
              request a run
            </a>.
          </p>
        </div>
      </section>
    </main>
  );
}
