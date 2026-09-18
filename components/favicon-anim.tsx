"use client";

import { useEffect } from "react";
import { MARK_BOX, MARK_DOTS } from "./logo-mark";

/* Animated tab icon. Browsers only show the first frame of an animated SVG
   favicon, so this redraws a 32px canvas (the dot drop, a droplet falling and
   splashing) and swaps the <link rel="icon"> href ~10 times a second. The
   static app/icon.svg stays as the fallback. Off under reduced motion. */
const SIZE = 64; // drawn at 2x, browsers downscale
const FPS = 10;
const LOOP = 28; // frames per cycle

export default function FaviconAnim() {
  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      /* keep going */
    }
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const original = link.href;
    const cv = document.createElement("canvas");
    cv.width = SIZE;
    cv.height = SIZE;
    const g = cv.getContext("2d");
    if (!g) return;
    let dark = false;
    try {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      dark = false;
    }
    const color = dark ? "#a78bfa" : "#6d28d9";
    // fit the 90 x 136 mark box into the square, centred
    const k = SIZE / (MARK_BOX.h - 4);
    const ox = (SIZE - MARK_BOX.w * k) / 2;
    let f = 0;

    const frame = () => {
      g.clearRect(0, 0, SIZE, SIZE);
      g.fillStyle = color;
      g.strokeStyle = color;
      const p = f / LOOP;
      // body: a gentle size wave down the rows
      for (const d of MARK_DOTS) {
        const wave = 1 + 0.25 * Math.max(0, Math.sin((p - d.row * 0.03) * Math.PI * 2));
        g.beginPath();
        g.arc(ox + d.x * k, d.y * k, Math.max(1.1, d.r * k * 1.5 * wave), 0, Math.PI * 2);
        g.fill();
      }
      const x = ox + MARK_BOX.dripX * k;
      const y0 = MARK_BOX.dripY * k;
      const fy = MARK_BOX.floor * k;
      if (p < 0.85) {
        // gather, then fall and fade
        const q = p / 0.85;
        g.globalAlpha = q > 0.8 ? (1 - q) / 0.2 : 1;
        const y = q < 0.35 ? y0 : y0 + (fy - y0) * ((q - 0.35) / 0.65) ** 2;
        g.beginPath();
        g.arc(x, y, 2.4 * Math.min(1, 0.4 + q * 2), 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }
      link.href = cv.toDataURL("image/png");
      f = (f + 1) % LOOP;
    };
    const id = window.setInterval(frame, 1000 / FPS);
    return () => {
      window.clearInterval(id);
      link.href = original;
    };
  }, []);
  return null;
}
