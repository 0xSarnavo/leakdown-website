"use client";

import { useEffect, useRef, useState } from "react";
import Turnstile, { useTurnstile } from "./turnstile";
import RequestForm from "./request-form";
import LogoMark from "./logo-mark";
import { CONTACT } from "../lib/site";

/* The two site-wide popups. Any element with data-open="request" or
   data-open="early" opens its box (links keep an href, so without JS they
   still land on the request section). Esc, the close button or a click on
   the backdrop closes a box. */

function Box({ id, title, open, onClose, children }: {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      className="rq-dialog"
      ref={ref}
      aria-labelledby={`${id}-h`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rq-card">
        <div className="rq-card-head">
          <div className="rq-title">
            <LogoMark className="rq-logo" />
            <h3 id={`${id}-h`}>{title}</h3>
          </div>
          <button className="rq-x" type="button" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function EarlyForm() {
  const turnstile = useTurnstile("early-access");
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState("");
  const [done, setDone] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = data.get("email");
    const consent = data.get("consent") === "on";
    const token = turnstile.token();
    setTone("is-info");
    setMsg("sending…");
    try {
      const r = await fetch("/api/early-access", {
        method: "POST",
        cache: "no-store",
        credentials: "omit",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, consent, token }),
      });
      const b = await r.json().catch(() => ({}));
      turnstile.reset();
      if (r.ok) {
        setMsg("");
        setDone(true);
      } else {
        setTone("is-err");
        setMsg(typeof b.error === "string" ? b.error : "Could not send. Try again.");
      }
    } catch {
      setTone("is-err");
      setMsg("Could not send. Try again.");
    }
  };
  if (done)
    return (
      <div className="rq-done" role="status">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="21" pathLength={1} />
          <path d="M15 24.5l6 6 12-13" pathLength={1} />
        </svg>
        <p className="rq-done-h">You are on the list.</p>
        <p className="rq-done-s">We will write when your spot opens.</p>
      </div>
    );
  return (
    <form className="request early" onSubmit={onSubmit} aria-label="Get early access">
      <label className="rq-field">
        Email
        <input name="email" type="email" placeholder="you@company.com" required autoComplete="email" />
      </label>
      <label className="consent">
        <input name="consent" type="checkbox" required />{" "}
        <span>
          Keep my email so you can write to me when a spot opens. Nothing else is sent, and one email
          to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> removes it. I have read the{" "}
          <a href="/privacy">privacy policy</a>.
        </span>
      </label>
      <Turnstile innerRef={turnstile.ref} />
      <button className="btn rq-submit" type="submit">
        Get early access
      </button>
      <p className={tone ? `reqmsg ${tone}` : "reqmsg"} aria-live="polite">
        {msg}
      </p>
    </form>
  );
}

export default function SiteDialogs() {
  const [open, setOpen] = useState<"" | "request" | "early">("");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-open]");
      const which = el?.dataset.open;
      if (which !== "request" && which !== "early") return;
      e.preventDefault();
      setOpen(which);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const close = () => setOpen("");
  return (
    <>
      <Box id="dlg-request" title="Request a run" open={open === "request"} onClose={close}>
        <RequestForm idPrefix="rq-form" />
      </Box>
      <Box id="dlg-early" title="Get early access" open={open === "early"} onClose={close}>
        <EarlyForm />
      </Box>
    </>
  );
}
