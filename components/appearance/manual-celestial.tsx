"use client";

import { useEffect, useRef } from "react";
import { celestialFrame, THEME_TRANSITION_MS } from "@/app/appearance";
import styles from "./castle-backdrop.module.css";

// The browser owns every frame, including while global theme tokens are repainted.
export function ManualCelestial({ target, ready, reduced }: { target: number; ready: boolean; reduced: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  useEffect(() => {
    const element = container.current;
    if (!element || !ready) return;
    const sun = element.children[0] as HTMLDivElement;
    const moon = element.children[1] as HTMLDivElement;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    const start = initialized.current ? Math.max(0, Math.min(1, (matrix.m41 / window.innerWidth * 100 - celestialFrame(0).x) / (celestialFrame(1).x - celestialFrame(0).x))) : target;
    const frames = Array.from({ length: 61 }, (_, i) => celestialFrame(start + (target - start) * i / 60));
    const transform = (frame: ReturnType<typeof celestialFrame>) => `translate3d(${frame.x}vw, ${frame.y}vh, 0)`;
    const end = frames[60];
    element.style.transform = transform(end);
    sun.style.opacity = String(end.sun);
    moon.style.opacity = String(end.moon);
    const shouldAnimate = initialized.current && !reduced && Math.abs(start - target) > .00001;
    initialized.current = true;
    if (!shouldAnimate) return;
    const options = { duration: THEME_TRANSITION_MS, easing: "cubic-bezier(.42, 0, .58, 1)" };
    const animations = [
      element.animate(frames.map((frame) => ({ transform: transform(frame) })), options),
      sun.animate(frames.map((frame) => ({ opacity: frame.sun })), options),
      moon.animate(frames.map((frame) => ({ opacity: frame.moon })), options),
    ];
    return () => {
      // Freeze the visible frame before cancelling so rapid reversals never jump.
      const transform = getComputedStyle(element).transform;
      const sunOpacity = getComputedStyle(sun).opacity;
      const moonOpacity = getComputedStyle(moon).opacity;
      element.style.transform = transform;
      sun.style.opacity = sunOpacity;
      moon.style.opacity = moonOpacity;
      animations.forEach((animation) => animation.cancel());
    };
  }, [ready, reduced, target]);
  return <div ref={container} className={`${styles.celestial} ${styles.manualCelestial}`}><div className={styles.sun} /><div className={styles.moon} /></div>;
}
