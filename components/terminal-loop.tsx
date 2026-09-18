"use client";

import { useEffect, useRef } from "react";

/* A replay of real `leakdown` sessions, in the exact shapes the CLI prints
   (src/cli.ts + src/session.ts): stage banners, the crawl spinner, per-step
   thought lines, exit blocks, the in-place "agents finished" bar, the ladder's
   filter/done lines, --history and --goal. Typed prompt, auto-scroll, `clear`
   between commands, then it loops. Site and people are placeholders.
   Pauses offscreen and on a hidden tab. Reduced motion / no IO: the static
   snapshot below stays (it is also what SSR paints). */

type Seg = [text: string, cls?: string];
type Ev =
  | { k: "cmd"; text: string }
  | { k: "out"; segs: Seg[]; d?: number }
  | { k: "spin"; text: string; ms: number; done?: Seg[] }
  | { k: "bar"; from: number; to: number; total: number; between?: Ev[][] }
  | { k: "wait"; ms: number }
  | { k: "clear" };

const o = (d: number, ...segs: Seg[]): Ev => ({ k: "out", segs, d });
const gap = (d = 60): Ev => ({ k: "out", segs: [[""]], d });
const BAR_W = 24;
const bar = (n: number, t: number) => {
  const f = Math.round((n / t) * BAR_W);
  return `  [${"#".repeat(f)}${"-".repeat(BAR_W - f)}] ${n}/${t} agents finished`;
};
const RULE = "=".repeat(60);

const LADDER: Ev[] = [
  { k: "cmd", text: "leakdown your-site.com --ladder --yes --headless" },
  o(420, ["  ✓ ", "t-ok"], ["environment already verified 2026-09-16 (skipping re-checks, --force to redo)", "t-dim"]),
  gap(),
  o(260, ["  ladder on your-site.com: wide haiku ×10 → filter → sonnet verifies → opus digs"]),
  gap(),
  o(300, ["▸ stage 1/5 · site", "t-stage"]),
  { k: "spin", text: "reading the page", ms: 1400 },
  o(80, ["  product   ", "t-dim"], ["API for search over your own docs"]),
  o(70, ["  audience  ", "t-dim"], ["developers wiring search into an app"]),
  o(70, ["  signup    ", "t-dim"], ["/signup · email + 6-digit code · plan picker"]),
  gap(40),
  o(90, ["  brief: ", "t-dim"], ["runs/your-site.com/SITE.md", "t-path"]),
  gap(),
  o(280, ["▸ stage 2/5 · map", "t-stage"]),
  {
    k: "spin",
    text: "crawling the site",
    ms: 1900,
    done: [["  38 pages: docs 21, marketing 9, auth 4, pricing 2, payment 2"]],
  },
  o(90, ["  payment  ", "t-dim"], ["/billing", "t-path"], [" — commit refused by the guard", "t-warn"]),
  gap(40),
  o(90, ["  map: ", "t-dim"], ["runs/your-site.com/MAP.md", "t-path"]),
  gap(),
  o(280, ["▸ stage 3/5 · personas", "t-stage"]),
  { k: "spin", text: "generating 10 personas with haiku", ms: 1600 },
  o(60, ["  ✓ ", "t-ok"], ["10 persona file(s) written to personas/"]),
  gap(),
  o(280, ["▸ stage 4/5 · visit", "t-stage"]),
  o(120, ["  10 prospect(s) going in together: ", "t-dim"], ["priya, marcus, hassan, lena, tomas, …"], [" | haiku, headless", "t-dim"]),
  { k: "out", segs: [[bar(0, 10), "t-bar"]], d: 160 },
  gap(),
  o(520, ["  [priya] ", "t-tag"], ["[1/12 · 2/10 confusion] ", "t-dim"], ["Priya: "], ['"Pricing is clear. Starting on the free tier."', "t-quote"]),
  o(460, ["  [marcus] ", "t-tag"], ["mailbox: ", "t-dim"], ["marcus.4f1c@inbox.leakdown.dev", "t-path"]),
  o(520, ["  [lena] ", "t-tag"], ["[1/10 · 3/10 confusion] ", "t-dim"], ["Lena: "], ['"Docs first. I want to see the API before I sign up."', "t-quote"]),
  o(480, ["  [marcus] ", "t-tag"], ["📬 checking inbox (5s)...", "t-dim"]),
  o(560, ["  [priya] ", "t-tag"], ["[4/12 · 6/10 confusion] ", "t-dim"], ["Priya: "], ['"This reads like a done page. Where is continue?"', "t-quote"]),
  o(480, ["  [hassan] ", "t-tag"], ["⚠ action failed (1/3): ", "t-warn"], ["plan button not clickable"]),
  o(520, ["  [tomas] ", "t-tag"], ["🛑 blocked: ", "t-err"], ["CAPTCHA on /signup before the email field"]),
  {
    k: "bar",
    from: 0,
    to: 10,
    total: 10,
    between: [
      [
        o(280, [RULE, "t-dim"]),
        o(60, ["  [1/10] "], ["ABANDONED", "t-err"]),
        o(60, ["  Where: ", "t-dim"], ["step 4 on "], ["/signup/step-2", "t-path"]),
        o(60, ["  Why: ", "t-dim"], ['"The plan selector looks like a confirmation. I think I am done."', "t-quote"]),
        o(60, ["  Session: ", "t-dim"], ["runs/your-site.com/2026-09-16/10-14/wide/priya", "t-path"]),
      ],
      [o(420, ["  [marcus] ", "t-tag"], ["✓ goal verified complete", "t-ok"])],
      [],
      [
        o(300, [RULE, "t-dim"]),
        o(60, ["  [4/10] "], ["ABANDONED", "t-err"]),
        o(60, ["  Where: ", "t-dim"], ["step 7 on "], ["/pricing", "t-path"]),
        o(60, ["  Why: ", "t-dim"], ['"The docs link here is a 404. I cannot find the API reference."', "t-quote"]),
      ],
      [],
      [o(360, ["  [lena] ", "t-tag"], ["[9/10 · 7/10 confusion] ", "t-dim"], ["Lena: "], ['"Signed in with Google and landed back on the homepage."', "t-quote"])],
      [],
      [],
      [],
    ],
  },
  gap(),
  o(420, ["  filter: ", "t-dim"], ["3 replicated ref(s), 1 single-source; 3 session(s) go to the verifier"]),
  { k: "spin", text: "sonnet verifying 3 session(s)", ms: 1700, done: [["  ✓ ", "t-ok"], ["3 findings hold up · VERIFIED.md"]] },
  { k: "spin", text: "opus re-walking priya (deep)", ms: 1800, done: [["  ✓ ", "t-ok"], ["deep session: stalled at the same step"]] },
  gap(),
  o(280, ["▸ stage 5/5 · report", "t-stage"]),
  o(200, ["  run: 11 session(s) → ", "t-dim"], ["runs/your-site.com/2026-09-16/10-14/AGGREGATE.md", "t-path"]),
  o(260, ["  ladder done: 10 wide + 1 deep session(s). VERIFIED.md and REPORT.md sit beside the report."]),
  gap(),
  o(240, ["  3 of 10 prospects stalled at signup step 2", "t-strong"]),
  o(120, ["  Fix first: ", "t-dim"], ["the plan picker on /signup/step-2 reads as a finish page"]),
  gap(40),
  o(120, ["  Full report: ", "t-dim"], ["runs/your-site.com/2026-09-16/10-14/AGGREGATE.md", "t-path"], [", then REPORT.md beside it", "t-dim"]),
  gap(),
  { k: "wait", ms: 2600 },
];

const HISTORY: Ev[] = [
  { k: "cmd", text: "leakdown --history" },
  gap(200),
  o(80, ["  your-site.com", "t-strong"]),
  o(90, ["    2026-09-16 10-14  ", "t-dim"], ["3 of 10 stalled at signup step 2    "], ["wide+deep  REPORT", "t-dim"]),
  o(90, ["    2026-09-09 16-02  ", "t-dim"], ["5 of 10 stalled at signup step 2    "], ["wide", "t-dim"]),
  gap(),
  o(120, ["  Open: runs/<site>/<date>/<time>/AGGREGATE.md — or leakdown --fix <site> for the newest run.", "t-dim"]),
  gap(),
  { k: "wait", ms: 2000 },
];

const GOAL: Ev[] = [
  { k: "cmd", text: 'leakdown your-site.com --goal "sign up and get an API key" --steps 15 --yes' },
  gap(300),
  o(200, ["  Priya (cold) is visiting https://your-site.com"]),
  o(80, ["  brain: haiku | patience: 15 steps", "t-dim"]),
  gap(),
  { k: "spin", text: "[1/15] thinking", ms: 900, done: [["  [1/15 · 1/10 confusion] ", "t-dim"], ["Priya: "], ['"Signing up with my work email."', "t-quote"]] },
  { k: "spin", text: "[2/15] thinking", ms: 800, done: [["  [2/15 · 2/10 confusion] ", "t-dim"], ["Priya: "], ['"Code is in the inbox. Entering it."', "t-quote"]] },
  { k: "spin", text: "📬 checking inbox (5s)", ms: 1000, done: [["  📬 ", "t-dim"], ["code 481 920 found", "t-ok"]] },
  { k: "spin", text: "[3/15] thinking", ms: 800, done: [["  [3/15 · 5/10 confusion] ", "t-dim"], ["Priya: "], ['"A plan picker. Free tier, continue."', "t-quote"]] },
  { k: "spin", text: "[4/15] thinking", ms: 800, done: [["  [4/15 · 2/10 confusion] ", "t-dim"], ["Priya: "], ['"Dashboard. The API keys tab has one ready."', "t-quote"]] },
  o(300, ["  ✓ goal verified complete", "t-ok"]),
  gap(),
  o(200, [RULE, "t-dim"]),
  o(60, ["  [1/1] "], ["COMPLETED", "t-ok"]),
  o(60, ["  API key visible on /dashboard/keys after 4 steps"]),
  o(60, [bar(1, 1), "t-bar"]),
  gap(),
  o(160, ["  exit 0 ", "t-ok"], ["· pass", "t-dim"]),
  gap(),
  { k: "wait", ms: 2400 },
];

const SCRIPT: Ev[] = [...LADDER, { k: "clear" }, ...HISTORY, { k: "clear" }, ...GOAL, { k: "clear" }];

const TYPE_MS = 34;
const SPIN = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const MAX_LINES = 140;

export default function TerminalLoop() {
  const termRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const term = termRef.current;
    if (!body || !term) return;
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }
    if (reduced || !("IntersectionObserver" in window)) return; // static snapshot stays

    let alive = true;
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const waiters: Array<() => void> = [];
    const active = () => visible && document.visibilityState !== "hidden";
    const flush = () => {
      if (!active()) return;
      while (waiters.length) waiters.shift()!();
    };
    const vio = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      flush();
    }, { threshold: 0.1 });
    vio.observe(term);
    document.addEventListener("visibilitychange", flush);

    // every wait goes through the gate, so nothing ticks while hidden
    const sleep = (ms: number) =>
      new Promise<void>((res) => {
        timer = setTimeout(() => (active() ? res() : waiters.push(res)), ms);
      });

    const scroll = () => {
      while (body.childElementCount > MAX_LINES) body.firstElementChild?.remove();
      body.scrollTop = body.scrollHeight;
    };
    const paint = (el: HTMLElement, segs: Seg[]) => {
      el.replaceChildren(
        ...segs.map(([text, cls]) => {
          const s = document.createElement("span");
          if (cls) s.className = cls;
          s.textContent = text;
          return s;
        }),
      );
    };
    const line = (segs: Seg[]) => {
      const el = document.createElement("div");
      el.className = "tl";
      paint(el, segs);
      body.append(el);
      scroll();
      return el;
    };
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.setAttribute("aria-hidden", "true");

    const prompt = () => {
      const el = line([
        ["~/work", "t-cwd"],
        [" ❯ ", "t-ok"],
      ]);
      const typed = document.createElement("span");
      el.append(typed, caret);
      return typed;
    };

    const run = async (evs: Ev[]): Promise<void> => {
      for (const ev of evs) {
        if (!alive) return;
        if (ev.k === "cmd") {
          const typed = prompt();
          await sleep(700);
          for (let i = 1; i <= ev.text.length; i++) {
            if (!alive) return;
            typed.textContent = ev.text.slice(0, i);
            // a little human rhythm: pauses after spaces and flags
            const ch = ev.text[i - 1];
            await sleep(TYPE_MS + (ch === " " ? 40 : 0) + Math.random() * 30);
          }
          await sleep(350);
          caret.remove();
        } else if (ev.k === "out") {
          if (ev.d) await sleep(ev.d);
          line(ev.segs);
        } else if (ev.k === "spin") {
          const el = line([["  ⠋ ", "t-accent"], [ev.text + "...", "t-dim"]]);
          const frames = Math.max(1, Math.round(ev.ms / 80));
          for (let f = 0; f < frames; f++) {
            if (!alive) return;
            paint(el, [[`  ${SPIN[f % SPIN.length]} `, "t-accent"], [ev.text + "...", "t-dim"]]);
            await sleep(80);
          }
          if (ev.done) paint(el, ev.done);
          else el.remove();
          scroll();
        } else if (ev.k === "bar") {
          // the bar reprints below whatever finished since, like the real tally
          for (let n = ev.from + 1; n <= ev.to; n++) {
            const extra = ev.between?.[n - 1] ?? [];
            await run(extra);
            await sleep(extra.length ? 200 : 650);
            // nothing printed since the last tally: redraw it in place, like \r
            const last = body.lastElementChild as HTMLElement | null;
            if (!extra.length && last?.dataset.bar) paint(last, [[bar(n, ev.total), "t-bar"]]);
            else line([[bar(n, ev.total), "t-bar"]]).dataset.bar = "1";
          }
        } else if (ev.k === "wait") {
          const idle = prompt();
          void idle;
          await sleep(ev.ms);
          caret.remove();
        } else if (ev.k === "clear") {
          const typed = body.lastElementChild?.querySelector("span:nth-child(3)") as HTMLElement | null;
          if (typed) {
            body.lastElementChild?.append(caret);
            for (const ch of "clear") {
              typed.textContent += ch;
              await sleep(60);
            }
            await sleep(250);
          }
          body.replaceChildren();
          await sleep(200);
        }
      }
    };

    (async () => {
      body.replaceChildren();
      while (alive) await run(SCRIPT);
    })();

    return () => {
      alive = false;
      vio.disconnect();
      document.removeEventListener("visibilitychange", flush);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="term" ref={termRef}>
      <div className="tbar">
        <i></i>
        <i></i>
        <i></i>
        <span className="ttitle">leakdown — zsh — 96×24</span>
      </div>
      <div className="tbody" ref={bodyRef} aria-hidden="true">
        {/* static snapshot: SSR paint and the reduced-motion view */}
        <div className="tl">
          <span className="t-cwd">~/work</span>
          <span className="t-ok"> ❯ </span>
          <span>leakdown your-site.com --ladder --yes --headless</span>
        </div>
        <div className="tl"><span className="t-ok">  ✓ </span><span className="t-dim">environment already verified (skipping re-checks)</span></div>
        <div className="tl"> </div>
        <div className="tl"><span className="t-stage">▸ stage 2/5 · map</span></div>
        <div className="tl"><span>  38 pages: docs 21, marketing 9, auth 4, pricing 2, payment 2</span></div>
        <div className="tl"> </div>
        <div className="tl"><span className="t-stage">▸ stage 4/5 · visit</span></div>
        <div className="tl"><span className="t-tag">  [priya] </span><span className="t-dim">[4/12 · 6/10 confusion] </span><span>Priya: </span><span className="t-quote">&quot;This reads like a done page. Where is continue?&quot;</span></div>
        <div className="tl"><span className="t-dim">{RULE}</span></div>
        <div className="tl"><span>  [1/10] </span><span className="t-err">ABANDONED</span></div>
        <div className="tl"><span className="t-dim">  Where: </span><span>step 4 on </span><span className="t-path">/signup/step-2</span></div>
        <div className="tl"><span className="t-bar">{bar(10, 10)}</span></div>
        <div className="tl"> </div>
        <div className="tl"><span className="t-strong">  3 of 10 prospects stalled at signup step 2</span></div>
      </div>
      <p className="visually-hidden">
        A terminal replaying a Leakdown run: it reads the site, maps it, builds ten prospects, sends
        them through signup, filters what more than one cites, and writes the report.
      </p>
    </div>
  );
}
