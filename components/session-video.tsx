"use client";

import { useEffect, useRef, useState } from "react";

/* Muted looping session clip at 2.5x. Fetches only metadata (a first frame)
   until an IO plays it at >=25% visible; it pauses offscreen so it costs
   nothing while scrolled away. Reduced motion: no autoplay, native controls
   instead. No IntersectionObserver: plain autoplay. */
type Props = { className?: string; src: string; ariaLabel: string };
const RATE = 2.5;

export default function SessionVideo({ className, src, ariaLabel }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let prefersReduced = false;
    try {
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      prefersReduced = false;
    }
    if (prefersReduced) {
      setReduced(true);
      return;
    }
    v.muted = true;
    v.defaultPlaybackRate = RATE;
    v.playbackRate = RATE;
    const onMeta = () => {
      v.playbackRate = RATE; // some browsers reset the rate once metadata lands
    };
    v.addEventListener("loadedmetadata", onMeta);
    const play = () => {
      v.play().catch(() => {});
    };
    if (!("IntersectionObserver" in window)) {
      v.autoplay = true;
      play();
      return () => v.removeEventListener("loadedmetadata", onMeta);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.25) play();
        else v.pause();
      },
      { threshold: [0, 0.25] },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  return (
    /* Two sources, MP4 first: Safari and iOS play H.264 and not VP8, so a
       webm-only clip rendered as an empty box on every Apple device — on a page
       whose whole job is showing what a session looks like. */
    <video
      ref={ref}
      className={className}
      aria-label={ariaLabel}
      muted
      loop
      playsInline
      preload="metadata"
      controls={reduced}
      disablePictureInPicture
    >
      <source src={src.replace(/\.webm$/, ".mp4")} type="video/mp4" />
      <source src={src} type="video/webm" />
    </video>
  );
}
