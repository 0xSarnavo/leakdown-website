"use client";

import { useEffect, useRef, useState } from "react";
import { trackRepo } from "./track";
import { DOCS, EXT, REPO } from "../lib/site";
import LogoMark from "./logo-mark";

type Theme = "auto" | "light" | "dark";

const KEY = "leakdown-theme";

// in page order; Docs is the separate docs site
const LINKS: Array<[string, string]> = [
  ["live", "Live"],
  ["features", "Features"],
  ["faq", "FAQ"],
  ["request", "Request"],
];

export default function SiteNav() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [effective, setEffective] = useState<"light" | "dark">("light");
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState("");
  const [menu, setMenu] = useState(false);
  const fx = useRef(0);
  const fxTimer = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark" || saved === "auto") {
        setTheme(saved);
      }
    } catch {
      /* storage unavailable: stay on auto */
    }
    const nav = navRef.current;
    if (!nav) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        nav.classList.toggle("scrolled", window.scrollY > 24);
        const h1 = document.querySelector("#install h1");
        const line = h1
          ? h1.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 8
          : 0;
        nav.classList.toggle("over-hero", window.scrollY < line);
        // the section under the nav's bottom edge lights its link
        const probe = nav.offsetHeight + window.innerHeight * 0.3;
        let on = "";
        for (const [id] of LINKS) {
          const el = document.getElementById(id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.top <= probe && r.bottom > probe) on = id;
        }
        setActive((cur) => (cur === on ? cur : on));
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // the phone menu closes on Escape
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable: theme still applies for the session */
    }
    if (theme === "light" || theme === "dark") {
      setEffective(theme);
    } else {
      try {
        setEffective(
          window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        );
      } catch {
        setEffective("light");
      }
    }
  }, [theme]);

  const cycle = () => {
    setTheme((t) => (t === "auto" ? "light" : t === "light" ? "dark" : "auto"));
  };

  const dark = effective === "dark";

  return (
    <nav className="sticky" id="nav" aria-label="Main" ref={navRef}>
      <div className="nav-inner">
        <a
          className="mark"
          href="/#top"
          onClick={(e) => {
            // each click plays the next effect (burst, spin, refill, ripple):
            // drop the old class, force a reflow, add the new one
            const el = e.currentTarget;
            const next = (fx.current % 4) + 1;
            fx.current = next;
            el.classList.remove("fx-1", "fx-2", "fx-3", "fx-4");
            void el.offsetWidth;
            el.classList.add(`fx-${next}`);
            window.clearTimeout(fxTimer.current);
            fxTimer.current = window.setTimeout(() => el.classList.remove(`fx-${next}`), 1000);
          }}
        >
          <LogoMark className="logo-mark" />
          Leakdown
        </a>
      <div className="nl-group">
        {LINKS.map(([id, label], i) => (
          <a
            key={id}
            className={`nl${active === id ? " is-on" : ""}`}
            href={`/#${id}`}
            aria-current={active === id ? "location" : undefined}
          >
            <b>{String(i + 1).padStart(2, "0")}</b>
            {label}
          </a>
        ))}
        <a className="nl" href={DOCS} {...EXT}>
          <b>05</b>Docs
          <span className="nl-ext" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
      <span className="sp"></span>
        <a className="icon-btn" href={REPO} {...EXT} onClick={() => trackRepo("nav")} aria-label="Leakdown CLI on GitHub">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>
        <a className="btn sm nav-cta" href="/#request" data-open="request" aria-haspopup="dialog">
          Request a run
          <span className="arr" aria-hidden="true">
            ↗
          </span>
        </a>
        <button
          className="icon-btn"
          type="button"
          onClick={cycle}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {/* icon shows the current state: moon in dark, sun in light */}
          {!dark ? (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <button
          className="icon-btn nav-menu-btn"
          type="button"
          aria-expanded={menu}
          aria-controls="nav-menu"
          aria-label={menu ? "Close menu" : "Open menu"}
          onClick={() => setMenu((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>
      <div className={`nav-menu${menu ? " is-open" : ""}`} id="nav-menu" inert={!menu}>
        {LINKS.map(([id, label], i) => (
          <a key={id} href={`/#${id}`} className={active === id ? "is-on" : undefined} onClick={() => setMenu(false)}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            {label}
          </a>
        ))}
        <a href={DOCS} {...EXT} onClick={() => setMenu(false)}>
          <b>05</b>Docs ↗
        </a>
        <a href={REPO} {...EXT} onClick={() => { trackRepo("menu"); setMenu(false); }}>
          <b>06</b>GitHub ↗
        </a>
      </div>
    </nav>
  );
}
