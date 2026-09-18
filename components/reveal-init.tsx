"use client";

import { useEffect } from "react";

/* Global progressive enhancement: .js gate for reveal/hstep CSS, one-shot
   IntersectionObserver reveals with --i stagger. No-JS renders settled. */
export default function RevealInit() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      // fire a little before the element clears the fold so the rise never lags the scroll
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
