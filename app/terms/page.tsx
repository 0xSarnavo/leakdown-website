import type { Metadata } from "next";
import { CONTACT, SITE } from "../../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms — Leakdown",
  description:
    "Ground rules for the Leakdown alpha: what the run-request service is, what a run does to your site, and what the report is not.",
  alternates: { canonical: `${SITE}/terms` },
};

export default function Terms() {
  return (
    <main className="narrow">
      <section aria-label="Terms of service">
        <header className="pg-head">
          <p className="kicker">Terms</p>
          <h1>Terms of service</h1>
          <p className="sub">Ground rules for the Leakdown alpha: what the run-request service is, what a run does to your site, and what the report is not.</p>
          <ul className="pg-meta">
            <li>Operator <b>Sarnavo Saha Sardar</b></li>
            <li>Governing law <b>India</b></li>
            <li>Updated <b>18 Sep 2026</b></li>
          </ul>
        </header>
        <div className="prose" data-reveal>
          <p>
            These terms cover the run-request service on this website, operated by Sarnavo Saha
            Sardar, an individual based in India (&quot;the operator&quot;). The open-source tool is
            separately licensed under the MIT licence in its repository; these terms do not change
            that licence.
          </p></div>
        <ul className="pg-toc" data-reveal>
          <li><a href="#what-the-service-is"><i>01</i>What the service is</a></li>
          <li><a href="#you-must-be-allowed-to-test-the-site"><i>02</i>You must be allowed to test the site</a></li>
          <li><a href="#what-a-run-does-to-your-site"><i>03</i>What a run does to your site</a></li>
          <li><a href="#what-the-report-is"><i>04</i>What the report is</a></li>
          <li><a href="#acceptable-use"><i>05</i>Acceptable use</a></li>
          <li><a href="#your-data"><i>06</i>Your data</a></li>
          <li><a href="#ownership"><i>07</i>Ownership</a></li>
          <li><a href="#no-warranty"><i>08</i>No warranty</a></li>
          <li><a href="#limitation-of-liability"><i>09</i>Limitation of liability</a></li>
          <li><a href="#ending-the-service"><i>10</i>Ending the service</a></li>
          <li><a href="#governing-law"><i>11</i>Governing law</a></li>
          <li><a href="#changes"><i>12</i>Changes</a></li>
          <li><a href="#contact"><i>13</i>Contact</a></li>
        </ul>
        <section className="pg-sec" id="what-the-service-is" data-reveal>
          <div className="pg-sec-h">
            <span className="n">01</span>
            <h2>What the service is</h2>
          </div>
          <div className="prose">
          <p>
            You give a site URL and an email address. The operator may run simulated prospects
            through that site and email you a report. The service is in alpha: runs are free,
            offered at the operator&apos;s discretion, and any request may be declined or left
            unfulfilled without notice. Nothing runs automatically — each run is started by hand.
            There is no service level.
          </p></div>
        </section>
        <section className="pg-sec" id="you-must-be-allowed-to-test-the-site" data-reveal>
          <div className="pg-sec-h">
            <span className="n">02</span>
            <h2>You must be allowed to test the site</h2>
          </div>
          <div className="prose">
          <p>
            By submitting a request you confirm that you own the site or are authorised by its owner
            to have it tested this way. Do not submit sites you do not control. The operator may ask
            for proof and will refuse requests that look unauthorised.
          </p></div>
        </section>
        <section className="pg-sec" id="what-a-run-does-to-your-site" data-reveal>
          <div className="pg-sec-h">
            <span className="n">03</span>
            <h2>What a run does to your site</h2>
          </div>
          <div className="prose">
          <p>
            Simulated prospects behave like visitors. They load pages, fill in signup and booking
            forms, create accounts with throwaway email addresses, and read the verification emails
            your site sends to those addresses. Before they start, the tool also crawls the site
            once — up to 200 internal pages, two clicks deep, plus anything in your
            <code>sitemap.xml</code> — to map what is there and find broken links. Expect test accounts in your database, sessions in
            your analytics, and mail in your sending logs. You are responsible for cleaning those up
            and for telling anyone on your side who needs to know.
          </p>
          <p>
            A guard refuses payments, booking confirmations and third-party sign-in (Google, GitHub,
            SSO) at the action itself. It matches button labels and is best effort. A prompt rule
            also tells prospects not to delete data, invite teammates, publish anything, open support
            chat or contact third parties — that one is instruction, not machinery, so a
            &quot;request a demo&quot; form or a trial that needs no card can still be submitted. Do
            not request a run on a live checkout and rely on it never buying anything.
          </p></div>
        </section>
        <section className="pg-sec" id="what-the-report-is" data-reveal>
          <div className="pg-sec-h">
            <span className="n">04</span>
            <h2>What the report is</h2>
          </div>
          <div className="prose">
          <p>
            The report describes what simulated prospects did and said. It is a risk signal about
            where real visitors could stall. It is not a measurement of your traffic, your conversion
            rate or your users, and it is not a security audit, an accessibility certification or
            professional advice. Findings only one session made are marked unverified. You decide
            what to act on.
          </p></div>
        </section>
        <section className="pg-sec" id="acceptable-use" data-reveal>
          <div className="pg-sec-h">
            <span className="n">05</span>
            <h2>Acceptable use</h2>
          </div>
          <div className="prose">
          <ul>
            <li>Only sites you own or are authorised to test.</li>
            <li>No use to probe, load-test or gather information about a third party.</li>
            <li>No sites whose content or purpose is unlawful in India or where they operate.</li>
            <li>No attempts to abuse the request form, the rate limit or the storage behind it.</li>
          </ul></div>
        </section>
        <section className="pg-sec" id="your-data" data-reveal>
          <div className="pg-sec-h">
            <span className="n">06</span>
            <h2>Your data</h2>
          </div>
          <div className="prose">
          <p>
            How your request and the run&apos;s output are handled is in the{" "}
            <a href="/privacy">privacy policy</a>, which is part of these terms.
          </p></div>
        </section>
        <section className="pg-sec" id="ownership" data-reveal>
          <div className="pg-sec-h">
            <span className="n">07</span>
            <h2>Ownership</h2>
          </div>
          <div className="prose">
          <p>
            The report is yours to use, share and quote. The tool is MIT licensed. The text and
            design of this website are the operator&apos;s. A tested site is named publicly only
            with its owner&apos;s written consent.
          </p></div>
        </section>
        <section className="pg-sec" id="no-warranty" data-reveal>
          <div className="pg-sec-h">
            <span className="n">08</span>
            <h2>No warranty</h2>
          </div>
          <div className="prose">
          <p>
            The service and every report are provided as is, without any warranty, express or
            implied, including fitness for a particular purpose. Simulated prospects can be wrong,
            miss things, or misread a page.
          </p></div>
        </section>
        <section className="pg-sec" id="limitation-of-liability" data-reveal>
          <div className="pg-sec-h">
            <span className="n">09</span>
            <h2>Limitation of liability</h2>
          </div>
          <div className="prose">
          <p>
            To the fullest extent permitted by law, the operator is not liable for any indirect,
            incidental or consequential loss, or for any loss of data, revenue or business, arising
            from a run, a report, or a decision you make because of one. Where liability cannot be
            excluded it is limited to the amount you paid for the service, which during the alpha is
            nothing.
          </p></div>
        </section>
        <section className="pg-sec" id="ending-the-service" data-reveal>
          <div className="pg-sec-h">
            <span className="n">10</span>
            <h2>Ending the service</h2>
          </div>
          <div className="prose">
          <p>
            The operator may pause or stop the service, or refuse any request, at any time. You may
            withdraw a request or ask for your data to be deleted at any time by email.
          </p></div>
        </section>
        <section className="pg-sec" id="governing-law" data-reveal>
          <div className="pg-sec-h">
            <span className="n">11</span>
            <h2>Governing law</h2>
          </div>
          <div className="prose">
          <p>
            These terms are governed by the laws of India. Disputes are subject to the jurisdiction
            of the courts of India.
          </p></div>
        </section>
        <section className="pg-sec" id="changes" data-reveal>
          <div className="pg-sec-h">
            <span className="n">12</span>
            <h2>Changes</h2>
          </div>
          <div className="prose">
          <p>
            Changes are made here, with the date at the top. Continuing to use the service after a
            change means you accept it.
          </p></div>
        </section>
        <section className="pg-sec" id="contact" data-reveal>
          <div className="pg-sec-h">
            <span className="n">13</span>
            <h2>Contact</h2>
          </div>
          <div className="prose">
          <p>
            Sarnavo Saha Sardar, <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p></div>
        </section>
      </section>
    </main>
  );
}
