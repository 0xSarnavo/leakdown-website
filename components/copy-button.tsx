"use client";

import { useRef, useState } from "react";

/* Copy button: flips to copied | copy failed for 1400ms, then back (text
   variant preserves the exact legacy strings). Icon variant shows a
   clipboard glyph that becomes a check on success. */
export default function CopyButton({
  target,
  variant = "text",
}: {
  target: string;
  variant?: "text" | "icon";
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<number | null>(null);

  const onClick = async () => {
    const src = document.getElementById(target);
    const txt = src ? (src.textContent || "").trim() : "";
    let next: "ok" | "fail" = "fail";
    if (txt && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(txt);
        next = "ok";
      } catch {
        next = "fail";
      }
    }
    setState(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1400);
  };

  if (variant === "icon") {
    return (
      <button
        className="copy icon"
        type="button"
        onClick={onClick}
        aria-label={state === "ok" ? "Copied" : state === "fail" ? "Copy failed" : "Copy command"}
      >
        {state === "ok" ? (
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    );
  }

  const label = state === "ok" ? "copied" : state === "fail" ? "copy failed" : "copy";
  return (
    <button className="copy" type="button" onClick={onClick}>
      {label}
    </button>
  );
}
