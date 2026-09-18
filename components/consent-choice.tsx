"use client";

import { useEffect, useState } from "react";
import { dnt, getConsent, setConsent } from "./consent";

/**
 * The same choice, changeable afterwards, on the privacy page.
 *
 * A policy that describes analytics without offering a way out is only half an
 * answer. Turning it off stops the next page view; what PostHog already holds
 * is deleted the same way as everything else, by asking.
 */
export default function ConsentChoice() {
  const [state, setState] = useState<"granted" | "denied" | "unset" | "dnt">("unset");

  useEffect(() => {
    const read = () => setState(dnt() ? "dnt" : (getConsent() ?? "unset"));
    read();
    window.addEventListener("ld-consent", read);
    return () => window.removeEventListener("ld-consent", read);
  }, []);

  if (state === "dnt")
    return (
      <p>
        Your browser sends Do Not Track, so analytics are off here and you were never asked.
      </p>
    );

  return (
    <p>
      {state === "granted"
        ? "Analytics are on for this browser."
        : state === "denied"
          ? "Analytics are off for this browser."
          : "You have not chosen yet, so analytics are off."}{" "}
      <button
        type="button"
        className="btn ghost"
        onClick={() => setConsent(state === "granted" ? "denied" : "granted")}
      >
        {state === "granted" ? "Turn them off" : "Turn them on"}
      </button>
    </p>
  );
}
