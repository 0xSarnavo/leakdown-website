"use client";

import { useEffect, useRef } from "react";

/* Canvas ASCII interference field with decrypting words. Ported from the
   reference implementation: dense slash field, large organic travelling glow
   that brightens the glyphs themselves, at most two simultaneous words (one
   on narrow screens), slash cells fully replaced under active words,
   whole-word decrypt as a unit.

   Refinements vs the reference: ResizeObserver sizing and a static single
   frame under prefers-reduced-motion. No libraries, no pointer interaction.

   Per-frame budget: the glow ellipse is exactly zero outside its bounding
   box, so only cells inside the box evaluate the wave; unlit cells are
   batched by quantized alpha (one globalAlpha per bucket, one fillStyle);
   lit cells use cached fillStyle strings. Word masks are per-row spans.
   The rAF loop stops while offscreen or the tab is hidden, and the wave
   easing is dt-based so dropped frames do not slow the drift. */

const WORDS = [
  // what a run finds: where a prospect or an agent gets stuck, and what it costs
  "STUCK", "WALKED OUT", "GAVE UP", "DROP-OFF", "DEAD END", "LOST", "LEAK",
  "SIGNUP STALL", "FORM RESET", "NO EMAIL", "CODE LATE", "BROKEN LINK", "404",
  "EMPTY PAGE", "TIMEOUT", "CAPTCHA WALL", "SSO ONLY", "AGENT BLOCKED",
  "BOT BLOCKED", "NO LABEL", "CONFUSED", "WRONG BUTTON", "LOOPED", "RETRY",
  "CITED 3/10", "VERIFIED", "CHECK IT", "SEALED", "FIXED", "RE-WALKED",
];
const GLITCH = ["/", "/", "/", "/", "/", "/", "/", "$", "£", "€"];
const FONT = `"IBM Plex Mono", ui-monospace, SFMono-Regular, Consolas, monospace`;

const GLOW_STEPS = 64; // fillStyle cache resolution for lit cells
const DIM_STEPS = 12; // alpha buckets for unlit cells, base range 0.12..0.16
const DIM_MIN = 0.12;
const DIM_RANGE = 0.04;
const FRAME_MS = 1000 / 60;
const EASE = 0.018 * 0.82; // per-60fps-frame lerp factor from the reference
const MAX_DT = 64;

type Word = {
  text: string;
  row: number;
  start: number;
  end: number;
  born: number;
  encrypt: number;
  decode: number;
  hold: number;
  dissolve: number;
  seed: number;
};
type Phase = "hidden" | "encrypt" | "decode" | "hold" | "dissolve";
type WaveFrame = { x: number; y: number; rx: number; ry: number };

function buildColors(dark: boolean): string[] {
  const out: string[] = [];
  for (let i = 0; i < GLOW_STEPS; i++) {
    const glow = i / (GLOW_STEPS - 1);
    if (dark) {
      const v = Math.round(208 + glow * 34);
      out.push(`rgb(${v},${v - 4},${v - 12})`);
    } else {
      const v = Math.round(84 - glow * 52);
      out.push(`rgb(${v},${v - 3},${v - 10})`);
    }
  }
  return out;
}

type Props = {
  /** always draw the dark palette (the 404 scene is dark in both themes) */
  dark?: boolean;
  /** replacement word list */
  words?: string[];
  /** glow targets sit on a ring around the middle instead of clustering in it */
  ring?: boolean;
  /** glow follows the mouse while it is over the field; roams otherwise */
  follow?: boolean;
  /** drifting clusters of $ and £ in the field: the money leaking out */
  money?: boolean;
};

export default function AsciiCanvas({ dark = false, words: wordList, ring = false, follow = false, money = false }: Props) {
  const wordsRef = useRef<string[] | undefined>(wordList);
  wordsRef.current = wordList;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const wrapEl: HTMLDivElement = wrap;
    const canvasEl: HTMLCanvasElement = canvas;
    const ctxOrNull = canvasEl.getContext("2d", { alpha: true });
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let fontSize = 15;
    let cellW = 10;
    let cellH = 21;
    let cols = 0;
    let rows = 0;
    let gap = new Uint8Array(0);
    let phase = new Float32Array(0);
    let rowStart = new Int32Array(0);
    let rowEnd = new Int32Array(0);
    let colWobble = new Float32Array(0);
    let words: Word[] = [];

    const darkColors = buildColors(true);
    const lightColors = buildColors(false);
    const dimBuckets: number[][] = Array.from({ length: DIM_STEPS }, () => []);

    /* The glow roams: an eased tween to a centre-biased target, then a 1.1–2s
       rest during which one or two words decrypt inside the lit region. */
    const wave = {
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      t0: 0,
      dur: 1,
      radiusX: 170,
      radiusY: 115,
      trx: 170,
      try: 115,
      seed: Math.random() * 1000,
      resting: false,
      restUntil: 0,
      spawnLeft: 0,
      nextSpawn: 0,
    };

    const moneyCells: number[] = [];
    const pointer = { x: 0, y: 0, inside: false, at: 0, settleAt: 0 };
    let following = false;

    function pickTarget(now: number) {
      // mean of two uniforms: triangular, so targets cluster around the middle
      const u = () => (Math.random() + Math.random()) / 2;
      wave.fx = wave.x;
      wave.fy = wave.y;
      if (ring) {
        const a = Math.random() * Math.PI * 2;
        wave.tx = width * (0.5 + Math.cos(a) * (0.27 + Math.random() * 0.12));
        wave.ty = height * (0.5 + Math.sin(a) * (0.3 + Math.random() * 0.1));
      } else {
        wave.tx = width * (0.15 + u() * 0.7);
        wave.ty = height * (0.3 + u() * 0.45); // clear of the masked top and bottom rows
      }
      const dist = Math.hypot(wave.tx - wave.fx, wave.ty - wave.fy);
      wave.dur = 520 + dist * 1.5 + Math.random() * 220; // roughly constant speed
      wave.t0 = now;
      wave.trx = Math.max(140, width * (0.12 + Math.random() * 0.12));
      wave.try = Math.max(90, height * (0.22 + Math.random() * 0.12));
      wave.resting = false;
    }

    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* matchMedia unavailable: keep animating */
    }

    let darkQuery: MediaQueryList | null = null;
    try {
      darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      darkQuery = null;
    }
    function isDarkTheme(): boolean {
      if (dark) return true;
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark") return true;
      if (attr === "light") return false;
      try {
        return darkQuery ? darkQuery.matches : true;
      } catch {
        return true;
      }
    }

    function resize() {
      const rect = wrapEl.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = Math.round(width * dpr);
      canvasEl.height = Math.round(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = Math.max(14, Math.min(21, width / 76));
      cellW = fontSize * 0.63;
      cellH = fontSize * 1.36;
      cols = Math.ceil(width / cellW) + 4;
      rows = Math.ceil(height / cellH) + 3;

      buildField();
      rowStart = new Int32Array(rows);
      rowEnd = new Int32Array(rows);
      colWobble = new Float32Array(cols);
      words = [];

      wave.x = width * 0.5;
      wave.y = height * 0.5;
      wave.radiusX = Math.max(140, width * 0.14);
      wave.radiusY = Math.max(90, height * 0.26);
      pickTarget(performance.now());
    }

    function buildField() {
      const n = rows * cols;
      gap = new Uint8Array(n);
      phase = new Float32Array(n);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const largeGap =
            Math.random() < 0.1 || (Math.sin(c * 0.071 + r * 1.11) > 0.78 && Math.random() < 0.25);
          gap[i] = largeGap ? 1 : 0;
          phase[i] = Math.random() * Math.PI * 2;
        }
      }
    }

    function canPlace(row: number, start: number, len: number): boolean {
      return !words.some(
        (w) => w.row === row && start < w.end + 7 && start + len > w.start - 7,
      );
    }

    function spawnWord(now: number) {
      const waveRow = Math.round(wave.y / cellH);
      const waveCol = Math.round(wave.x / cellW);
      for (let attempt = 0; attempt < 40; attempt++) {
        const list = wordsRef.current ?? WORDS;
        const text = list[Math.floor(Math.random() * list.length)];
        if (cols - text.length - 8 < 0) continue;
        let row: number;
        let start: number;
        // Spawn at the glow's middle so the decrypt plays out centered and readable.
        const occupied = new Set(words.map((w) => w.row));
        const rowOpts: number[] = [];
        for (let dr = 0; dr <= 4; dr++) {
          for (const s of dr === 0 ? [0] : [-dr, dr]) {
            const r = waveRow + s;
            if (r < 3 || r > rows - 3 || occupied.has(r)) continue; // stay inside the drawn, unmasked rows
            if ([...occupied].some((rr) => Math.abs(rr - r) <= 1)) continue;
            rowOpts.push(r);
          }
        }
        if (!rowOpts.length) continue;
        row = rowOpts[0];
        const centered = waveCol - Math.floor(text.length / 2);
        let startPlaced = -1;
        for (let dx = 0; dx <= 5; dx++) {
          for (const s of dx === 0 ? [0] : [-dx, dx]) {
            const st = Math.max(4, Math.min(cols - text.length - 4, centered + s));
            if (canPlace(row, st, text.length)) {
              startPlaced = st;
              break;
            }
          }
          if (startPlaced >= 0) break;
        }
        if (startPlaced < 0) continue;
        start = startPlaced;
        words.push({
          text,
          row,
          start,
          end: start + text.length,
          born: now,
          encrypt: 180 + Math.random() * 90,
          decode: 340 + Math.random() * 140,
          hold: 560 + Math.random() * 320,
          dissolve: 320 + Math.random() * 140,
          seed: Math.random() * 999999,
        });
        return;
      }
    }

    function progressFor(w: Word, now: number): { phase: Phase; p: number; alpha: number } {
      const age = now - w.born;
      if (age < 0) return { phase: "hidden", p: 0, alpha: 0 };
      if (age < w.encrypt) {
        return { phase: "encrypt", p: age / w.encrypt, alpha: 0.25 + 0.14 * (age / w.encrypt) };
      }
      if (age < w.encrypt + w.decode) {
        const p = (age - w.encrypt) / w.decode;
        const e = p * p * (3 - 2 * p);
        return { phase: "decode", p: e, alpha: 0.39 + 0.53 * e };
      }
      if (age < w.encrypt + w.decode + w.hold) {
        return { phase: "hold", p: 1, alpha: 0.93 };
      }
      const p = (age - w.encrypt - w.decode - w.hold) / w.dissolve;
      const e = 1 - p * p * (3 - 2 * p);
      return { phase: "dissolve", p: e, alpha: 0.93 * e };
    }

    function glitchText(w: Word, now: number): string {
      let s = "";
      const tick = Math.floor(now / 115);
      for (let i = 0; i < w.text.length; i++) {
        const n = Math.abs(Math.sin((tick + i * 19) * 12.9898 + w.seed) * 43758.5453) % 1;
        s += GLITCH[Math.floor(n * GLITCH.length)];
      }
      return s;
    }

    function wordText(w: Word, state: { phase: Phase; p: number }, now: number): string {
      if (state.phase === "hidden") return "";
      if (state.phase === "encrypt") return glitchText(w, now);
      if (state.phase === "hold") return w.text;
      const g = glitchText(w, now);
      if (state.phase === "decode") return state.p > 0.52 ? w.text : g;
      if (state.phase === "dissolve") return state.p > 0.38 ? w.text : g;
      return w.text;
    }

    function updateWave(now: number, dt: number): WaveFrame {
      if (follow && pointer.inside && now - pointer.at < 2600) {
        // chase the cursor; words spawn once it has been still for a moment
        const f = 1 - Math.pow(1 - 0.09, dt / FRAME_MS);
        const gap = Math.hypot(pointer.x - wave.x, pointer.y - wave.y);
        wave.x += (pointer.x - wave.x) * f;
        wave.y += (pointer.y - wave.y) * f;
        wave.trx = Math.max(150, width * 0.13);
        wave.try = Math.max(100, height * 0.2);
        if (gap > 24) {
          wave.resting = false;
          pointer.settleAt = now + 320;
        } else if (!wave.resting && now >= pointer.settleAt) {
          wave.resting = true;
          wave.restUntil = Number.POSITIVE_INFINITY;
          wave.spawnLeft = 2 + (Math.random() < 0.5 ? 1 : 0);
          wave.nextSpawn = now + 30;
        }
        following = true;
      } else if (following) {
        // cursor left: hand back to the roaming path from where the glow is
        following = false;
        wave.resting = true;
        wave.restUntil = now + 500;
      } else if (wave.resting) {
        if (now >= wave.restUntil) pickTarget(now);
      } else {
        const p = Math.min(1, (now - wave.t0) / wave.dur);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // ease in-out cubic
        wave.x = wave.fx + (wave.tx - wave.fx) * e;
        wave.y = wave.fy + (wave.ty - wave.fy) * e;
        if (p >= 1) {
          wave.resting = true;
          wave.restUntil = now + 900 + Math.random() * 600;
          wave.spawnLeft = 2 + (Math.random() < 0.5 ? 1 : 0);
          wave.nextSpawn = now + 40;
        }
      }
      // radius glides toward its per-target size (frame-rate independent lerp)
      const k = dt > 0 ? 1 - Math.pow(1 - EASE * 2, dt / FRAME_MS) : 0;
      wave.radiusX += (wave.trx - wave.radiusX) * k;
      wave.radiusY += (wave.try - wave.radiusY) * k;
      const breatheX = 1 + Math.sin(now * 0.00052 + wave.seed) * 0.08;
      const breatheY = 1 + Math.sin(now * 0.00039 + wave.seed * 1.7) * 0.07;
      return { x: wave.x, y: wave.y, rx: wave.radiusX * breatheX, ry: wave.radiusY * breatheY };
    }

    function onPointer(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      const r = wrapEl.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height;
      pointer.at = performance.now();
    }
    if (follow && !reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    function wobbleAt(x: number, now: number): number {
      return Math.sin((x / Math.max(1, width)) * Math.PI * 2.8 + now * 0.00047) * height * 0.045;
    }

    function waveAt(x: number, y: number, wobbleY: number, wv: WaveFrame): number {
      const ddx = (x - wv.x) / wv.rx;
      const ddy = (y - wv.y - wobbleY) / wv.ry;
      const d = Math.sqrt(ddx * ddx + ddy * ddy);
      let s = Math.max(0, 1 - d);
      s = s * s * (3 - 2 * s);
      return s;
    }

    function draw(now: number, dt: number) {
      ctx.clearRect(0, 0, width, height);
      ctx.textBaseline = "top";
      ctx.font = `${fontSize}px ${FONT}`;
      const dark = isDarkTheme();
      const colors = dark ? darkColors : lightColors;

      const wv = updateWave(now, dt);
      const maxWords = width < 640 ? 2 : 3;

      // Words only appear while the glow is parked, one or two per rest.
      if (wave.resting && wave.spawnLeft > 0 && now >= wave.nextSpawn && words.length < maxWords) {
        spawnWord(now);
        wave.spawnLeft--;
        wave.nextSpawn = now + 110 + Math.random() * 130;
      }

      words = words.filter((w) => {
        const total = w.encrypt + w.decode + w.hold + w.dissolve;
        return now - w.born < total;
      });

      // Per-row word spans (placement guarantees at most one word per row).
      rowStart.fill(-1);
      rowEnd.fill(-1);
      for (const w of words) {
        rowStart[w.row] = w.start;
        rowEnd[w.row] = w.end;
      }

      // The glow is exactly zero outside its ellipse bounding box (plus wobble).
      const wobbleAmp = height * 0.045;
      const cMin = Math.max(0, Math.floor((wv.x - wv.rx) / cellW - 0.5));
      const cMax = Math.min(cols - 1, Math.ceil((wv.x + wv.rx) / cellW - 0.5));
      const rMin = Math.max(1, Math.floor((wv.y - wv.ry - wobbleAmp) / cellH - 0.4));
      const rMax = Math.min(rows - 1, Math.ceil((wv.y + wv.ry + wobbleAmp) / cellH - 0.4));
      for (let c = cMin; c <= cMax; c++) colWobble[c] = wobbleAt(c * cellW + cellW * 0.5, now);

      for (const b of dimBuckets) b.length = 0;
      moneyCells.length = 0;
      const tBase = now * 0.00034;
      const tM = now * 0.00022;
      let lastColor = -1;

      // Lit cells draw inline; unlit cells are bucketed and drawn after.
      for (let r = 1; r < rows; r++) {
        const ws = rowStart[r];
        const we = rowEnd[r];
        const inBand = r >= rMin && r <= rMax;
        const y = r * cellH + cellH * 0.4;
        const rowOff = r * cols;
        for (let c = 0; c < cols; c++) {
          if (gap[rowOff + c]) continue;
          if (c >= ws && c < we) continue;
          if (money) {
            // slow interference of sines: organic patches that drift and reshape
            const n =
              Math.sin(c * 0.11 + tM) * Math.sin(r * 0.55 - c * 0.03 + tM * 0.8) +
              Math.sin(c * 0.05 + r * 0.21 - tM * 0.6);
            if (n > 1.02) {
              moneyCells.push(rowOff + c);
              continue;
            }
          }
          const base = 0.14 + Math.sin(tBase + phase[rowOff + c]) * 0.02;
          const glow =
            inBand && c >= cMin && c <= cMax
              ? waveAt(c * cellW + cellW * 0.5, y, colWobble[c], wv)
              : 0;
          if (glow <= 0) {
            const b = Math.min(DIM_STEPS - 1, Math.floor(((base - DIM_MIN) / DIM_RANGE) * DIM_STEPS));
            dimBuckets[b].push(rowOff + c);
            continue;
          }
          const ci = Math.round(glow * (GLOW_STEPS - 1));
          if (ci !== lastColor) {
            ctx.fillStyle = colors[ci];
            lastColor = ci;
          }
          ctx.globalAlpha = Math.min(0.98, base + glow * 0.42);
          ctx.fillText("/", c * cellW, r * cellH);
        }
      }

      if (moneyCells.length) {
        ctx.fillStyle = colors[Math.round(GLOW_STEPS * 0.3)];
        ctx.globalAlpha = 0.36;
        const flip = Math.floor(now / 1100);
        for (const i of moneyCells) {
          const c = i % cols;
          const r = (i - c) / cols;
          const h = (c * 73 + r * 151 + flip * 7) % 7;
          if (h > 3) continue; // airy patches: roughly every other cell stays empty
          ctx.fillText(h === 0 ? "£" : "$", c * cellW, r * cellH);
        }
      }

      ctx.fillStyle = colors[0];
      for (let b = 0; b < DIM_STEPS; b++) {
        const list = dimBuckets[b];
        if (!list.length) continue;
        ctx.globalAlpha = DIM_MIN + ((b + 0.5) / DIM_STEPS) * DIM_RANGE;
        for (let i = 0; i < list.length; i++) {
          const idx = list[i];
          const r = (idx / cols) | 0;
          ctx.fillText("/", (idx - r * cols) * cellW, r * cellH);
        }
      }

      for (const w of words) {
        const state = progressFor(w, now);
        const cx = w.start * cellW + w.text.length * cellW * 0.5;
        const cy = w.row * cellH + cellH * 0.45;
        const mask = waveAt(cx, cy, wobbleAt(cx, now), wv);
        if (mask < 0.035) continue;
        const text = wordText(w, state, now);
        if (!text) continue;
        const textAlpha = Math.min(1, state.alpha * mask * 1.5);
        ctx.save();
        ctx.globalAlpha = 1;
        if (dark) {
          ctx.shadowColor = "rgba(255,255,255,0.85)";
          ctx.shadowBlur = 14;
          ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
        } else {
          ctx.shadowColor = "rgba(28,25,19,0.35)";
          ctx.shadowBlur = 10;
          ctx.fillStyle = `rgba(28,25,19,${textAlpha})`;
        }
        ctx.fillText(text, w.start * cellW, w.row * cellH);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    }

    // rAF runs only while onscreen and the tab is visible; otherwise it is
    // cancelled outright rather than ticking an empty loop.
    let raf = 0;
    let last = 0;
    let visible = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(MAX_DT, Math.max(0, now - last));
      last = now;
      draw(now, dt);
    };
    function sync() {
      const shouldRun = !reduced && visible && document.visibilityState !== "hidden";
      if (shouldRun && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    let vio: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      vio = new IntersectionObserver((es) => {
        visible = es[0]?.isIntersecting ?? true;
        sync();
      }, { threshold: 0 });
      vio.observe(wrap);
    }
    document.addEventListener("visibilitychange", sync);

    // Rebuilds are coalesced to one per frame and skipped when nothing changed.
    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        const rect = wrapEl.getBoundingClientRect();
        const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
        if (Math.max(1, rect.width) === width && Math.max(1, rect.height) === height && nextDpr === dpr) return;
        resize();
        if (reduced) draw(performance.now(), 0);
      });
    });
    ro.observe(wrap);
    resize();

    if (reduced) draw(performance.now(), 0);
    else sync();

    return () => {
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      raf = 0;
      ro.disconnect();
      vio?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [dark, ring, follow, money]);

  return (
    <div className="ascii-stream" ref={wrapRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
