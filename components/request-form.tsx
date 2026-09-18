"use client";

import { useEffect, useRef, useState } from "react";

/* Request door, ported 1:1 from public/app.js (26 lines). Legacy paths only:
   probe GET /orders (401 opens), submit POST /request {url,email,consent},
   plus the additive {plan, brief, publish}: a full run by default, a special
   run only when picked (then a brief), and an opt-in to post fixed findings.
   All EXACT strings byte-identical, including the ellipsis and the em dash
   in the server one-per-day 429 (rendered verbatim from {error}). */
const SENDING = "sending…";
const SUCCESS = "Got it. You will get an email when the run is done.";
const NETFAIL = "Could not send. Try again.";

// what a full run includes, in one line under the run choice
const FULL_RUN =
  "10 simulated prospects in a real browser, AI-agent walls, video and logs of every session, and a fix-first report.";

export default function RequestForm({ idPrefix = "request" }: { idPrefix?: string }) {
  // dev preview: show the form even when order storage is off locally
  const [open, setOpen] = useState(process.env.NODE_ENV !== "production");
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState("");
  const [plan, setPlan] = useState<"full" | "special">("full");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/orders", { cache: "no-store", credentials: "omit" })
      .then((r) => {
        if (r.status === 401) setOpen(true);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const f = new FormData(form);
    setTone("is-info");
    setMsg(SENDING);
    try {
      const r = await fetch("/request", {
        method: "POST",
        cache: "no-store",
        credentials: "omit",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: f.get("url"),
          email: f.get("email"),
          consent: f.get("consent") === "on",
          plan,
          brief: plan === "special" ? f.get("brief") : undefined,
          publish: f.get("publish") === "on",
        }),
      });
      const b = await r.json();
      if (r.ok) {
        setTone("is-ok");
        setMsg(SUCCESS);
        form.reset();
        setPlan("full");
      } else {
        setTone("is-err");
        setMsg(b.error);
      }
    } catch {
      setTone("is-err");
      setMsg(NETFAIL);
    }
  };

  return (
    <>
      <form
        id={idPrefix}
        className="request"
        hidden={!open}
        aria-label="Request a run"
        ref={formRef}
        onSubmit={onSubmit}
      >
        <label className="rq-field">
          Site{" "}
          <input
            name="url"
            type="url"
            placeholder="https://your-site.com"
            required
            autoComplete="url"
            inputMode="url"
          />
        </label>
        <label className="rq-field">
          Email{" "}
          <input
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
        </label>
        <fieldset className="rq-plan">
          <legend>Run</legend>
          <div className="rq-seg">
            <label className={plan === "full" ? "is-on" : undefined}>
              <input type="radio" name="plan" value="full" checked={plan === "full"} onChange={() => setPlan("full")} />
              Full run
            </label>
            <label className={plan === "special" ? "is-on" : undefined}>
              <input type="radio" name="plan" value="special" checked={plan === "special"} onChange={() => setPlan("special")} />
              Special run
            </label>
          </div>
          {plan === "full" ? (
            <p className="rq-inc">{FULL_RUN}</p>
          ) : (
            <label className="rq-brief">
              <span className="visually-hidden">What should we test?</span>
              <textarea
                name="brief"
                rows={3}
                maxLength={600}
                required
                placeholder="What should we test? e.g. sign up and create an API key, as a developer from a small team"
              />
            </label>
          )}
        </fieldset>
        <label className="consent">
          <input name="consent" type="checkbox" required />{" "}
          <span>
            I own this site or am authorised to test it. Simulated prospects will click through
            signup and booking forms; they never pay, book, or sign in with Google. My URL and
            email are stored privately, used only to send this report, and deleted when I ask. I
            have read the <a href="/privacy">privacy policy</a> and agree to the{" "}
            <a href="/terms">terms</a>.
          </span>
        </label>
        <label className="consent rq-publish">
          <input name="publish" type="checkbox" />{" "}
          <span>
            Optional: if a finding is real, you may share it publicly once it is fixed, in posts,
            case studies and ads.
          </span>
        </label>
        <button className="btn rq-submit" type="submit">
          Request a run
        </button>
        <p className="rq-after">The report lands in your inbox.</p>
        <p className={tone ? `reqmsg ${tone}` : "reqmsg"} aria-live="polite">
          {msg}
        </p>
      </form>
      <p className="small" id={`${idPrefix}-closed`} hidden={open}>
        Requests are closed right now. Run it yourself, or{" "}
        <a href="mailto:sssarnavo@gmail.com">email me</a>.
      </p>
    </>
  );
}
