import type { Metadata } from "next";
import { CONTACT, SITE } from "../../lib/site";
import ConsentChoice from "../../components/consent-choice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy — Leakdown",
  description:
    "What the run-request service collects, what a run produces, who else sees it, and how to have it deleted.",
  alternates: { canonical: `${SITE}/privacy` },
};

export default function Privacy() {
  return (
    <main className="narrow">
      <section aria-label="Privacy policy">
        <header className="pg-head">
          <h1>Privacy policy</h1>
          <p className="sub">What the run-request service collects, what a run produces, who else sees it, and how to have it deleted.</p>
          <ul className="pg-meta">
            <li>Operator <b>Sarnavo Saha Sardar</b></li>
            <li>Jurisdiction <b>India</b></li>
            <li>Updated <b>18 Sep 2026</b></li>
          </ul>
        </header>
        <div className="prose" data-reveal>
          <p>
            This site and the run-request service are operated by Sarnavo Saha Sardar, an individual
            based in India. Questions and requests go to{" "}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. The open-source tool runs
            on your own computer and sends nothing here — the last section covers it.
          </p></div>
        <ul className="pg-toc" data-reveal>
          <li><a href="#what-this-website-collects"><i>01</i>What this website collects</a></li>
          <li><a href="#what-a-requested-run-produces"><i>02</i>What a requested run produces</a></li>
          <li><a href="#who-else-sees-it"><i>03</i>Who else sees it</a></li>
          <li><a href="#your-analytics-choice"><i>04</i>Your analytics choice</a></li>
          <li><a href="#how-long-it-is-kept"><i>05</i>How long it is kept</a></li>
          <li><a href="#site-names-in-public"><i>06</i>Site names in public</a></li>
          <li><a href="#age"><i>07</i>Age</a></li>
          <li><a href="#the-open-source-tool"><i>08</i>The open-source tool</a></li>
          <li><a href="#changes"><i>09</i>Changes</a></li>
        </ul>
        <section className="pg-sec" id="what-this-website-collects" data-reveal>
          <div className="pg-sec-h">
            <span className="n">01</span>
            <h2>What this website collects</h2>
          </div>
          <div className="prose">
          <ul>
            <li>
              <strong>Analytics on this site and the docs site, if you allow them.</strong> Nothing
              is loaded and no cookie is set until you choose &quot;Allow&quot; on the box that
              asks on your first visit; a browser sending Do Not Track is never asked and never
              tracked.
              With consent, PostHog records page views, clicks and navigation, and replays of
              sessions on our own pages, to show which parts of the site people use, and sets a
              cookie and a browser-storage entry to recognise a returning browser. Everything goes
              to <code>/ingest</code> on this domain and is passed server-side to PostHog&apos;s US
              service — your browser never talks to a third-party domain, and no other third-party
              script or external font is loaded. Analytics run only on the live sites, never on
              previews or local copies. This covers our pages only; it has nothing to do with the
              site you ask us to test.
            </li>
            <li>
              <strong>Hosting logs.</strong> The hosting provider keeps ordinary web-server logs (IP
              address, path, time) under its own retention. The theme switch remembers your choice
              in your own browser and never leaves it.
            </li>
            <li>
              <strong>A run request, if you send one:</strong> the site URL you typed, your email
              address, the fact that you confirmed you are allowed to test the site, which run you
              picked, what you asked for if you picked a special run, whether you ticked the
              optional box allowing findings to be shared publicly, and the time. That is one
              record in a private object-storage bucket, readable only with a token held by the
              operator.
            </li>
            <li>
              <strong>Rate limiting</strong> keeps a count against your IP address for about a
              minute, so one sender cannot flood the form. In the key-value store the address is
              hashed first; in the fallback that runs when that store is unavailable it sits in the
              server&apos;s memory as-is until it is overwritten. Either way it is never written to
              disk and never joined to your request record.
            </li>
            <li>
              <strong>The early-access list, if you join it:</strong> your email address and the fact
              that you ticked the box asking us to write when a spot opens. One record in the same
              private bucket, kept until you ask for it to go — one email removes it.
            </li>
            <li>
              <strong>A human check on those two forms.</strong> Cloudflare Turnstile decides whether
              the sender looks automated. It reads the request and signals from your browser to make
              that call; it is on the forms only, not on ordinary pages, and it sets no advertising
              cookie.
            </li>
            <li>
              <strong>If you email directly:</strong> whatever you put in the email.
            </li>
          </ul></div>
        </section>
        <section className="pg-sec" id="what-a-requested-run-produces" data-reveal>
          <div className="pg-sec-h">
            <span className="n">02</span>
            <h2>What a requested run produces</h2>
          </div>
          <div className="prose">
          <p>
            The operator starts each run by hand on their own computer — nothing runs automatically
            when you submit the form. The URL is checked for shape, not fetched, until the operator
            opens it. Simulated prospects then visit the site you named in a real browser. The run
            produces screenshots, a screen recording, a step-by-step log of what each prospect saw,
            typed and decided, the page text behind every completion the tool checked, generated
            prospect profiles with fictional names, and the report.
          </p>
          <p>
            If your site sends verification emails, they go to throwaway addresses on a domain the
            operator controls, and the tool reads them to pull out codes and links. Those emails sit
            in the operator&apos;s mailbox and are rendered into the run folder as images. Anything
            visible on your pages during the run — including any personal data your own pages
            display — appears in those screenshots and logs.
          </p>
          <p>
            All of it is stored on the operator&apos;s computer, not on this website. The report is
            emailed to the address you gave, as a PDF.
          </p></div>
        </section>
        <section className="pg-sec" id="who-else-sees-it" data-reveal>
          <div className="pg-sec-h">
            <span className="n">03</span>
            <h2>Who else sees it</h2>
          </div>
          <div className="prose">
          <ul>
            <li>The hosting provider runs this site; a private bucket holds the request records.</li>
            <li>A key-value provider holds the one-minute rate-limit counters.</li>
            <li>PostHog (US) receives the analytics and session replays described above.</li>
            <li>Cloudflare runs the human check on the two forms and sees those submissions&apos; signals.</li>
            <li>Google delivers the report email from the operator&apos;s Gmail account, and the
              throwaway mailboxes are read over IMAP from that account.</li>
            <li>
              The AI provider whose model plays the prospects — Anthropic through Claude Code, or
              another provider the operator chooses, such as opencode or Codex — receives the text
              and screenshots of your pages, and the contents of the verification emails, during the
              run, under that provider&apos;s terms. The prospects&apos; email addresses are
              throwaway.
            </li>
          </ul>
          <p>
            Nothing is sold or shared for advertising. We write to you about your own request, and,
            if you joined the early-access list, once when a spot opens — nothing else.
          </p></div>
        </section>
        <section className="pg-sec" id="your-analytics-choice" data-reveal>
          <div className="pg-sec-h">
            <span className="n">04</span>
            <h2>Your analytics choice</h2>
          </div>
          <div className="prose">
          <ConsentChoice /></div>
        </section>
        <section className="pg-sec" id="how-long-it-is-kept" data-reveal>
          <div className="pg-sec-h">
            <span className="n">05</span>
            <h2>How long it is kept</h2>
          </div>
          <div className="prose">
          <p>
            Until you ask. Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from
            the address you used, and the request record, the run folder with its screenshots and
            recording, the throwaway mailboxes and the sent copy of the report are deleted within 30
            days. Deleted mailbox messages go to the mail provider&apos;s bin first, which keeps them
            about 30 more days. You can also ask what is held about you, or for a correction, the
            same way.
          </p>
          <p>
            Runs are kept while the alpha runs, so the tool can be improved against real journeys.
            They are not sold, not published, and not handed to anyone beyond the recipients listed
            above.
          </p></div>
        </section>
        <section className="pg-sec" id="site-names-in-public" data-reveal>
          <div className="pg-sec-h">
            <span className="n">06</span>
            <h2>Site names in public</h2>
          </div>
          <div className="prose">
          <p>
            A tested site is named publicly only with its owner&apos;s written consent — the tick box
            on the request form, or an email saying so. Until then it appears under a placeholder
            such as &quot;site-g&quot;. Change your mind and it comes down.
          </p></div>
        </section>
        <section className="pg-sec" id="age" data-reveal>
          <div className="pg-sec-h">
            <span className="n">07</span>
            <h2>Age</h2>
          </div>
          <div className="prose">
          <p>
            The service is for people who run, or are authorised to test, a website. It is not
            intended for anyone under 18.
          </p></div>
        </section>
        <section className="pg-sec" id="the-open-source-tool" data-reveal>
          <div className="pg-sec-h">
            <span className="n">08</span>
            <h2>The open-source tool</h2>
          </div>
          <div className="prose">
          <p>
            When you run Leakdown yourself, nothing is sent to this website. Sessions, recordings and
            reports stay on your machine. Your chosen AI provider sees the pages your prospects
            visit, and if you configure a mailbox, verification emails land in it. What that provider
            keeps is governed by your agreement with them.
          </p></div>
        </section>
        <section className="pg-sec" id="changes" data-reveal>
          <div className="pg-sec-h">
            <span className="n">09</span>
            <h2>Changes</h2>
          </div>
          <div className="prose">
          <p>
            Changes are made here, with the date at the top. Material changes to what is collected
            are also noted on the request form.
          </p></div>
        </section>
      </section>
    </main>
  );
}
