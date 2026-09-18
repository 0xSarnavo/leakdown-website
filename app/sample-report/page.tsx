import type { Metadata } from "next";
import { CAL, EXT, REPO, SITE } from "../../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sample report — Leakdown",
  description:
    "Anonymized excerpt from a settled Leakdown run: what a finding looks like, with check-it-yourself steps.",
  alternates: { canonical: `${SITE}/sample-report` },
};

/* `cited` is the number of the ten sessions that raised it. It drives the dot
   row, so a finding's weight is legible before the sentence is read — the same
   1-of-10 motif the hero uses. */
const FINDINGS = [
  {
    h: "Prospect 4 of 10 stalled at signup step 2",
    cited: 3,
    p: "The plan selector read like a confirmation page, so prospects stopped instead of continuing to payment.",
    check:
      "Open signup step 2 in a fresh window and watch whether the primary button reads as continue or done.",
  },
  {
    h: "Docs link 404 from the pricing page",
    cited: 2,
    p: "The footer docs link on /pricing returned 404, so two prospects gave up looking for the API reference.",
    check: "Click every footer link on /pricing in a fresh session.",
  },
  {
    h: "Google sign-in dead-ends the trial flow",
    cited: 2,
    p: "After Google OAuth the prospect landed back on the marketing page with no workspace, and walked out.",
    check: "Sign up with a throwaway Google account and note where you land.",
  },
];

const STATS = [
  { n: "10", l: "prospects" },
  { n: "3", l: "findings kept" },
  { n: "7", l: "dropped by the filter" },
  { n: "1", l: "re-walked" },
];

export default function SampleReport() {
  return (
    <main className="narrow">
      <section aria-label="Sample report">
        <header className="pg-head" data-reveal>
          <h1>What a finding looks like</h1>
          <p className="sub">
            An excerpt from a settled run on a real dev-tool site. Names withheld until the owners
            agree. Details changed just enough to hide the site; the failure shapes are real.
          </p>
          <ul className="pg-meta">
            <li>
              Run type <b>Full ladder</b>
            </li>
            <li>
              Prospects <b>10</b>
            </li>
            <li>
              Status <b>Settled</b>
            </li>
          </ul>
        </header>

        <div className="rep-card" data-reveal>
          <div className="rep-card-h">
            <span className="dot" aria-hidden="true" />
            <span>AGGREGATE.md — run settled</span>
          </div>
          <div className="rep-stats">
            {STATS.map((s) => (
              <div className="rep-stat" key={s.l}>
                <b>{s.n}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="alpha" data-reveal>
          Alpha. We don&apos;t know yet how well this matches real visitors. Each finding is a risk
          signal to check on your own page — not a measurement of your traffic.
        </p>

        {FINDINGS.map((f) => (
          <article className="rep-find" data-reveal key={f.h}>
            <div className="rep-cite">
              <span className="rep-dots" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <i className={i < f.cited ? "on" : undefined} key={i} />
                ))}
              </span>
              <span>
                Cited by {f.cited} of 10 sessions
              </span>
            </div>
            <h3>{f.h}</h3>
            <p>{f.p}</p>
            <div className="rep-check">
              <b>Check it yourself</b>
              <p>{f.check}</p>
            </div>
          </article>
        ))}

        <section className="pg-sec" id="how" data-reveal>
          <div className="pg-sec-h">
            <span className="n">01</span>
            <h2>How this was produced</h2>
          </div>
          <div className="prose">
            <p>
              Ten prospects — core customers, adjacent roles, people outside the target — each drove
              a real browser one viewport at a time until they finished, walked out, ran out of
              patience, or got stuck. This one was a full ladder run: cheap models voted, a filter
              kept only what more than one session cited, a verifier reviewed, and a stronger model
              re-walked the hardest prospect. Every step logged, every run recorded.
            </p>
          </div>
        </section>

        <section className="pg-sec" id="yours" data-reveal>
          <div className="pg-sec-h">
            <span className="n">02</span>
            <h2>What you get for your own site</h2>
          </div>
          <div className="prose">
            <p>
              Run it yourself and everything stays on your machine: the videos, the session logs, a
              one-page AGGREGATE.md, DETAIL.md behind it, and FIXES.md with check-it-yourself steps —
              plus REPORT.md when you run the ladder. Ask us for a run instead and you get the report
              as a PDF by email; the recordings and logs stay on our machine and are deleted when you
              ask.
            </p>
          </div>
        </section>

        <div className="cta-row" data-reveal>
          <a className="btn sm" href={REPO} {...EXT}>
            Run it yourself
          </a>
          <a className="btn ghost sm" href="/#request" data-open="request" aria-haspopup="dialog">
            Request a run
          </a>
          <a className="btn ghost sm" href={CAL} {...EXT}>
            Book 30 minutes
          </a>
        </div>
      </section>
    </main>
  );
}
