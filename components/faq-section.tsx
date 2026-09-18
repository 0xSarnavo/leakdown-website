"use client";

import { useState } from "react";

/* FAQ: what a requested run collects (per the privacy page), then the
   open-source CLI (each of those questions names it; answers from its
   README). A slim head strip (same as the live section's) over a full-width,
   one-open accordion; answers slide open (CSS .fq-*). */

const ITEMS: Array<[string, string]> = [
  [
    "What happens when I request a run, and what do you collect?",
    "It is a free early-access demo: we run a full run (or the special run you asked for) on our side and email you the report. We collect your site URL, your email, your run choice and brief, and whether you allow public sharing. We keep the run's videos, logs and screenshots of your site with the report. Nothing is sold, and everything is deleted when you ask. This site has its own analytics, described in the privacy policy; the site we test for you is never tracked. Findings go public only if you opt in, and only once they are fixed.",
  ],
  [
    "Is it safe to point the CLI at my site?",
    "Only run it on sites you own or have written permission to test. It creates real accounts and triggers the real emails and webhooks a signup triggers, so use a staging copy when you can.",
  ],
  [
    "What will the CLI never do?",
    "A guard refuses three things at the action itself: paying, confirming a booking, and signing in with Google, GitHub or SSO. Reaching that wall is the finding. The matching is best effort, so don’t point it at a live checkout and assume it can’t buy. Four more — deleting data, inviting teammates, publishing anything, and opening support chat or contacting third parties — are a rule the prospects are told to follow, not machinery: a “request a demo” form or a trial that needs no card can still be submitted.",
  ],
  [
    "Where does the CLI keep my data?",
    "Everything lands under runs/<site>/ on the machine that ran it — nothing goes to us. Your AI CLI does see each page your prospects visit, and any verification emails they read, under that provider’s terms. Delete a site with rm -rf runs/<site>. Requested runs keep your URL and email privately, only to send the report.",
  ],
  [
    "What does the CLI cost?",
    "The CLI is MIT and runs on the AI CLI subscription you already have (Claude Code, opencode or Codex), with no API keys — check that provider’s terms and rate limits for automated use, and expect a long sweep to hit a personal subscription’s limit. Requested runs are free during early access, one per day, and run at our discretion.",
  ],
  [
    "How long does a CLI run take?",
    "The full --ladder run takes about an hour. A single --goal check is a handful of steps, made for CI: exit 0 pass, 1 fail, 2 could not run.",
  ],
  [
    "Is a stalled prospect in a CLI report a lost customer?",
    "Read it as risk, not traffic. A simulated prospect stalling is a signal that real visitors could, never a measurement of them. Every finding carries its count, and under three sessions it says too few to call.",
  ],
];

export default function FaqSection() {
  const [open, setOpen] = useState(-1);
  return (
    <>
      <header className="sec-head bleed fq-head">
        <h2 data-reveal>Frequently asked questions</h2>
      </header>
      <div className="fq-list">
        {ITEMS.map(([q, a], i) => {
          const on = open === i;
          return (
            <div className={`fq-item${on ? " is-open" : ""}`} key={q} data-reveal>
              <h3>
                <button
                  type="button"
                  id={`fq-q${i}`}
                  aria-expanded={on}
                  aria-controls={`fq-a${i}`}
                  onClick={() => setOpen(on ? -1 : i)}
                >
                  <span>{q}</span>
                  <svg className="fq-chev" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 6l4.5 4.5L12.5 6" />
                  </svg>
                </button>
              </h3>
              <div className="fq-a" id={`fq-a${i}`} role="region" aria-labelledby={`fq-q${i}`} inert={!on}>
                <div>
                  <p>{a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
