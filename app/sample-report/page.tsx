import type { Metadata } from "next";
import { EXT, REPO } from "../../lib/site";
import { SITE } from "../../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sample report — Leakdown",
  description:
    "Anonymized excerpt from a settled Leakdown run: what a finding looks like, with check-it-yourself steps.",
  alternates: { canonical: `${SITE}/sample-report` },
};

const FINDINGS = [
  {
    h: "Prospect 4 of 10 stalled at signup step 2",
    p: "Cited by 3 of 10 sessions. The plan selector read like a confirmation page, so prospects stopped instead of continuing to payment.",
    check:
      "Check it yourself: open signup step 2 in a fresh window and watch whether the primary button reads as continue or done.",
  },
  {
    h: "Docs link 404 from the pricing page",
    p: "Cited by 2 of 10 sessions. The footer docs link on /pricing returned 404, so two prospects gave up looking for the API reference.",
    check: "Check it yourself: click every footer link on /pricing in a fresh session.",
  },
  {
    h: "Google sign-in dead-ends the trial flow",
    p: "Cited by 2 of 10 sessions. After Google OAuth the prospect landed back on the marketing page with no workspace, and walked out.",
    check:
      "Check it yourself: sign up with a throwaway Google account and note where you land.",
  },
];

export default function SampleReport() {
  return (
    <main className="narrow">
      <section aria-label="Sample report">
        <h1 data-reveal>What a finding looks like</h1>
        <p className="sub" data-reveal>
          Excerpt from a settled run on a real dev-tool site. Names withheld until the owners
          agree. Details changed just enough to hide the site; the failure shapes are real.
        </p>
        <p className="alpha" data-reveal>
          Alpha. We don&apos;t know yet how well this matches real visitors. Each finding is a
          risk signal to check on your own page — not a measurement of your traffic.
        </p>
        {FINDINGS.map((f) => (
          <article className="finding" data-reveal key={f.h}>
            <div className="row">
              <span className="badge">finding</span>
            </div>
            <h3>{f.h}</h3>
            <p>{f.p}</p>
            <p className="tiny">{f.check}</p>
          </article>
        ))}
        <div className="prose" data-reveal>
          <h3>How this was produced</h3>
          <p>
            Ten prospects — core customers, adjacent roles, people outside the target — each
            drove a real browser one viewport at a time until they finished, walked out, or ran
            out of patience. Cheap models voted; a filter kept only what more than one session
            cited; a verifier reviewed; a stronger model re-walked the hardest prospect. Every
            step logged, every run recorded.
          </p>
          <h3>What you get for your own site</h3>
          <p>
            The videos, the session logs, a full REPORT.md, a one-page AGGREGATE.md, and FIXES.md
            with check-it-yourself steps. Requested runs land the same report in your mail.
          </p>
        </div>
        <div className="cta-row" data-reveal>
          <a className="btn sm" href={REPO} {...EXT}>
            Run it yourself
          </a>
          <a className="btn ghost sm" href="/#request" data-open="request" aria-haspopup="dialog">
            Request a run
          </a>
        </div>
      </section>
    </main>
  );
}
