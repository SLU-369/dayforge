"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { solarSnapshot, type Capital } from "@/app/appearance";
import styles from "./castle-backdrop.module.css";

export function SolarCelestial({ city, now, moving }: { city: Capital; now: Date; moving: boolean }) {
  const current = solarSnapshot(now, city);
  const x = useMotionValue(`${current.sunPosition.x}vw`);
  const y = useMotionValue(`${current.sunPosition.y}vh`);
  const opacity = useMotionValue(current.sunPosition.opacity);
  const previous = useRef<{ time: number; city: string; moving: boolean } | null>(null);

  useEffect(() => {
    const solar = solarSnapshot(now, city);
    const prior = previous.current;
    const reset = !prior || prior.city !== city.id || !prior.moving || Math.abs(now.getTime() - prior.time) > 90000;
    if (reset || !moving) {
      x.set(`${solar.sunPosition.x}vw`);
      y.set(`${solar.sunPosition.y}vh`);
      opacity.set(solar.sunPosition.opacity);
    }
    previous.current = { time: now.getTime(), city: city.id, moving };
    if (!moving) return;
    // Predict one minute ahead: no visible step when the minute clock ticks.
    const next = solarSnapshot(new Date(now.getTime() + 60000), city).sunPosition;
    const transition = { duration: 60, ease: "linear" as const };
    const animations = [animate(x, `${next.x}vw`, transition), animate(y, `${next.y}vh`, transition), animate(opacity, next.opacity, transition)];
    return () => animations.forEach((animation) => animation.stop());
  }, [city, now, moving, x, y, opacity]);

  return <>
    <motion.div className={styles.celestial} style={{ x, y, opacity }}><div className={styles.sun} /></motion.div>
    <motion.div className={styles.celestial} style={{ x: "78vw", y: "14vh" }} initial={false} animate={{ opacity: current.weights.night * 0.8 }} transition={{ duration: moving ? 60 : 0, ease: "linear" }}><div className={styles.moon} /></motion.div>
  </>;
}
