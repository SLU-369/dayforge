"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CAPITALS, THEME_TRANSITION_MS, celestialFrame, solarSnapshot } from "@/app/appearance";
import { useTheme } from "@/app/theme-provider";
import { AmbientSky } from "./ambient-sky";
import { SolarCelestial } from "./solar-celestial";
import styles from "./castle-backdrop.module.css";

export function CastleBackdrop() {
  const { theme, preferences, ready, now } = useTheme();
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    const frame = requestAnimationFrame(update);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", update); };
  }, []);
  const city = CAPITALS.find((c) => c.id === preferences.cityId);
  const solar = preferences.mode === "automatic" && city && now ? solarSnapshot(now, city) : null;
  const day = solar ? solar.weights.day : theme === "day" ? 1 : 0;
  const twilight = solar?.weights.twilight ?? 0;
  const night = solar ? solar.weights.night : 1 - day;
  const automatic = Boolean(solar);
  const duration = reduced || !ready ? 0 : automatic ? 4 : THEME_TRANSITION_MS / 1000;
  const phase = useMotionValue(1);
  const initialized = useRef(false);
  const target = theme === "night" ? 1 : 0;
  useEffect(() => {
    if (!ready) return;
    if (!initialized.current || reduced) {
      phase.set(target);
      initialized.current = true;
      return;
    }
    // Retarget from the current phase, never remount or restart a keyframe path.
    const playback = animate(phase, target, { duration, ease: [0.42, 0, 0.58, 1] });
    return () => playback.stop();
  }, [phase, ready, reduced, target, duration]);
  const x = useTransform(phase, (p) => `${celestialFrame(p).x}vw`);
  const y = useTransform(phase, (p) => `${celestialFrame(p).y}vh`);
  const sunOpacity = useTransform(phase, (p) => celestialFrame(p).sun);
  const moonOpacity = useTransform(phase, (p) => celestialFrame(p).moon);
  const dayOpacity = useTransform(phase, (p) => 1 - p);
  const starOpacity = useTransform(phase, (p) => p * 0.75);
  return (
    <div className={styles.backdrop} data-ready={ready || undefined} data-theme={theme} aria-hidden="true">
      <div className={`${styles.scene} ${styles.night} theme-backdrop-night`} />
      <motion.div key={`day-${automatic}`} className={`${styles.scene} ${styles.day} theme-backdrop-day`} initial={false} style={automatic ? undefined : { opacity: dayOpacity }} animate={automatic ? { opacity: twilight < 1 ? day / (1 - twilight) : 0 } : undefined} transition={{ duration }} />
      <motion.div key={`twilight-${automatic}`} className={`${styles.scene} ${styles.twilight}`} initial={false} animate={{ opacity: automatic ? twilight : 0 }} transition={{ duration }} />
      <motion.div key={`stars-${automatic}`} className={styles.stars} initial={false} style={automatic ? undefined : { opacity: starOpacity }} animate={automatic ? { opacity: night * 0.75 } : undefined} transition={{ duration }} />
      {solar && city && now ? <SolarCelestial city={city} now={now} moving={visible && preferences.ambientMotion && !reduced} /> : <motion.div className={styles.celestial} style={{ x, y }}>
        <motion.div className={styles.sun} style={{ opacity: sunOpacity }} />
        <motion.div className={styles.moon} style={{ opacity: moonOpacity }} />
      </motion.div>}
      <AmbientSky enabled={ready && visible && preferences.ambientMotion && !reduced} />
      <div className={styles.veil} />
    </div>
  );
}
