"use client";

import { useEffect, useRef } from "react";

/* Request background: a dot field that fills with purple water while the
   section is held on screen. Scrolling through the hold makes it rain (the
   faster you scroll, the harder it rains), the tide rises with the scroll,
   and the surface sloshes with scroll speed before settling; scrolling back
   drains it. The surface also swells under the cursor. Pauses offscreen /
   hidden tab; half full and still under reduced motion. */

const GAP = 22; // same pitch as the dot grids elsewhere (.fs-right)
const LOW = 0.05; // share of the height under water at the start of the hold
const HIGH = 0.34; // ... and at the end

type Drop = { x: number; y: number; vy: number };
type Ring = { x: number; t0: number; amp: number };

const ease = (v: number) => v * v * (3 - 2 * v);
const clamp = (v: number) => Math.min(1, Math.max(0, v));

export default function DotTide() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const canvas: HTMLCanvasElement = cv;
    const g: CanvasRenderingContext2D = ctx;
    const pin = canvas.parentElement as HTMLElement; // .rq, sticky
    const hold = (pin.parentElement ?? pin) as HTMLElement; // .rq-hold, tall
    let w = 0;
    let h = 0;
    let ink = "#f1ede1";
    let accent = "#9d7bf5";
    let raf = 0;
    let visible = false;
    let level = LOW;
    let mx = -999;
    let hover = 0;
    let last = 0;
    let lastY = window.scrollY;
    let rainDebt = 0;
    let slosh = 0;
    let idleDrop = 0;
    const drops: Drop[] = [];
    const rings: Ring[] = [];

    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      ink = cs.getPropertyValue("--ink").trim() || ink;
      accent = cs.getPropertyValue("--accent").trim() || accent;
    };

    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let inside = false;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      inside = e.clientY >= r.top && e.clientY <= r.bottom;
    };
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    // 0 when the hold starts pinning, 1 when it lets go
    let stickTop = 0; // the pin's sticky offset (the nav height)
    const progress = () => {
      const hr = hold.getBoundingClientRect();
      const span = hr.height - pin.offsetHeight;
      return span > 0 ? clamp((stickTop - hr.top) / span) : 1;
    };

    const surface = (x: number, t: number, now: number) => {
      let y = h * (1 - level);
      const amp = 1 + slosh * 3;
      y += (Math.sin(x * 0.012 + t * 0.9) * 5 + Math.sin(x * 0.027 - t * 1.4) * 3) * amp;
      y += Math.sin(x * 0.006 - t * 2.2) * slosh * 10;
      if (hover > 0.01) {
        const d = x - mx;
        y -= Math.exp(-(d * d) / 2400) * 14 * hover;
      }
      for (const rg of rings) {
        const age = (now - rg.t0) / 1000;
        const d = Math.abs(x - rg.x);
        const front = age * 170;
        const a = Math.max(0, 1 - age / 1.6) * rg.amp;
        if (a > 0 && d < front + 30) y += Math.sin((d - front) * 0.12) * a * Math.exp(-Math.abs(d - front) / 40);
      }
      return y;
    };

    const draw = (now: number) => {
      const dt = Math.min(48, now - (last || now)) / 16;
      last = now;
      const t = now / 1000;
      const cols = Math.floor(w / GAP);
      const rows = Math.floor(h / GAP);
      const ox = (w - (cols - 1) * GAP) / 2;
      const oy = (h - (rows - 1) * GAP) / 2;

      if (reduced) {
        level = (LOW + HIGH) / 2;
      } else {
        const q = progress();
        level += (LOW + (HIGH - LOW) * ease(q) - level) * Math.min(1, 0.06 * dt);
        // scroll speed drives the rain and the slosh
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;
        if (q > 0 && q < 1 && dy > 0) rainDebt = Math.min(6, rainDebt + dy / 38);
        const speed = Math.min(1, Math.abs(dy) / 60);
        slosh += (speed - slosh) * Math.min(1, (speed > slosh ? 0.2 : 0.03) * dt);
        hover += ((inside ? 1 : 0) - hover) * Math.min(1, 0.1 * dt);
        while (rainDebt >= 1 && drops.length < 60 && w > 0) {
          rainDebt -= 1;
          drops.push({ x: ox + Math.floor(Math.random() * cols) * GAP, y: -10 - Math.random() * 80, vy: 2 + Math.random() * 2 });
        }
        // a light drizzle at rest
        if (now >= idleDrop && w > 0) {
          drops.push({ x: ox + Math.floor(Math.random() * cols) * GAP, y: -6, vy: 1 });
          idleDrop = now + 700 + Math.random() * 900;
        }
      }

      g.clearRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) {
        const x = ox + i * GAP;
        const sy = surface(x, t, now);
        for (let j = 0; j < rows; j++) {
          const y = oy + j * GAP;
          const under = y - sy; // > 0 means under water
          if (under > 0) {
            const depth = Math.min(1, under / (h * 0.5));
            const crest = Math.max(0, 1 - under / GAP);
            g.globalAlpha = 0.9 - depth * 0.45;
            g.fillStyle = accent;
            g.beginPath();
            g.arc(x, y, 1.5 + crest * 0.5 + (1 - depth) * 0.6, 0, Math.PI * 2);
            g.fill();
          } else {
            const near = Math.max(0, 1 + under / (GAP * 3));
            g.globalAlpha = 0.16 + near * 0.3;
            g.fillStyle = ink;
            g.beginPath();
            g.arc(x, y, 1 + near * 0.5, 0, Math.PI * 2);
            g.fill();
          }
        }
      }

      if (!reduced) {
        g.fillStyle = accent;
        for (let k = drops.length - 1; k >= 0; k--) {
          const d = drops[k];
          d.vy += 0.22 * dt;
          d.y += d.vy * dt;
          if (d.y >= surface(d.x, t, now)) {
            rings.push({ x: d.x, t0: now, amp: 5 + Math.min(5, d.vy * 0.4) });
            drops.splice(k, 1);
            continue;
          }
          if (d.y < -4) continue;
          // a short streak behind each drop
          const st = Math.min(3.2, 1 + d.vy * 0.12);
          g.globalAlpha = 0.28;
          g.beginPath();
          g.ellipse(d.x, d.y - 5 * st, 1.1, 4 * st, 0, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 0.95;
          g.beginPath();
          g.ellipse(d.x, d.y, 2.6 / Math.sqrt(st), 2.6 * Math.sqrt(st), 0, 0, Math.PI * 2);
          g.fill();
        }
        for (let k = rings.length - 1; k >= 0; k--) if (now - rings[k].t0 > 1600) rings.splice(k, 1);
        if (rings.length > 40) rings.splice(0, rings.length - 40);
      }
      g.globalAlpha = 1;
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      const on = visible && document.visibilityState !== "hidden" && !reduced;
      if (on && !raf) {
        last = 0;
        lastY = window.scrollY;
        raf = requestAnimationFrame(loop);
      }
      if (!on && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    readColors();
    stickTop = parseFloat(getComputedStyle(pin).top) || 0;
    size();
    draw(performance.now());
    const ro = new ResizeObserver(() => {
      stickTop = parseFloat(getComputedStyle(pin).top) || 0;
      size();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(canvas);
    const mo = new MutationObserver(() => {
      readColors();
      draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return <canvas className="tide-canvas" ref={ref} aria-hidden="true" />;
}
