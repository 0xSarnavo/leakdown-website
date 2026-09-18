import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms — Leakdown",
  description: "Ground rules for the Leakdown alpha: what the service is and is not.",
  alternates: { canonical: "https://leakdown.ai/terms" },
};

export default function Terms() {
  return (
    <main className="narrow">
      <section aria-label="Terms of service">
        <h1>Terms</h1>
        <p className="sub">Alpha ground rules. Plain language, binding intent.</p>
        <div className="prose">
          <h3>What this is</h3>
          <p>
            Leakdown sends simulated prospects through your site in a real browser and reports
            where they stalled and why. It is a risk signal to check on your own page — it does
            not measure your visitors, human or AI. The CLI is MIT licensed; the hosted
            request-a-run service is free while the queue is open, with no SLA.
          </p>
          <h3>Your promises</h3>
          <ul>
            <li>Only submit sites you own or are authorised to test.</li>
            <li>One request per email per day. No spam, no abuse of the queue.</li>
          </ul>
          <h3>Our promises</h3>
          <ul>
            <li>
              Requested-run agents click through signup and booking forms but never pay, book,
              or sign in with Google.
            </li>
            <li>Your URL and email are stored privately, used only to send the report.</li>
            <li>No call, no card, no prod access required to request.</li>
          </ul>
          <h3>Liability</h3>
          <p>
            Alpha software and alpha service, provided as-is. You decide what to change on your
            site based on the report.
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
