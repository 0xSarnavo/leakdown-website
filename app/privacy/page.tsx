import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy — Leakdown",
  description: "What Leakdown collects when you request a run, and what it never does.",
  alternates: { canonical: "https://leakdown.ai/privacy" },
};

export default function Privacy() {
  return (
    <main className="narrow">
      <section aria-label="Privacy policy">
        <h1>Privacy</h1>
        <p className="sub">Short version: your URL and email run one report, then sit still.</p>
        <div className="prose">
          <h3>What we collect</h3>
          <ul>
            <li>
              When you request a run: the site URL, your email address, your confirmation that
              you own the site or are authorised to test it, the run you picked (full or special)
              and, for a special run, what you asked us to test.
            </li>
            <li>
              Whether you let us share findings publicly. This is optional and off unless you tick
              it.
            </li>
            <li>
              From the run itself: the session videos, logs and screenshots of your site, kept with
              your report.
            </li>
            <li>When you email us directly: whatever you put in the email.</li>
          </ul>
          <h3>What we do with it</h3>
          <ul>
            <li>Check the URL exists and is reachable, queue the run, send the report.</li>
            <li>One request per email per day. Nothing else. No marketing list.</li>
          </ul>
          <h3>What we never do</h3>
          <ul>
            <li>No cookies. No analytics. No trackers. No third-party scripts or fonts.</li>
            <li>Your URL and email are stored privately and never published or sold.</li>
            <li>
              Findings are never made public unless you opted in, and then only once they are
              fixed: in posts, case studies or ads. Ask and we take them down.
            </li>
            <li>Requested-run agents never pay, book, or sign in with Google.</li>
          </ul>
          <h3>Deletion</h3>
          <p>
            Ask any time at <a href="mailto:sssarnavo@gmail.com">sssarnavo@gmail.com</a> and your
            request data, including run recordings and screenshots, is deleted.
          </p>
          <h3>Contact</h3>
          <p>
            Sarnavo Saha Sardar, <a href="mailto:sssarnavo@gmail.com">sssarnavo@gmail.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
