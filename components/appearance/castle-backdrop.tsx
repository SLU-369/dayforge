"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { CAPITALS, THEME_TRANSITION_MS, solarSnapshot } from "@/app/appearance";
import { useTheme } from "@/app/theme-provider";
import { AmbientSky } from "./ambient-sky";
import { SolarCelestial } from "./solar-celestial";
import { ManualCelestial } from "./manual-celestial";
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
  const target = theme === "night" ? 1 : 0;
  return (
    <div className={styles.backdrop} data-ready={ready || undefined} data-theme={theme} aria-hidden="true">
      <div className={`${styles.scene} ${styles.night} theme-backdrop-night`} />
      <motion.div key={`day-${automatic}`} className={`${styles.scene} ${styles.day} theme-backdrop-day`} initial={false} animate={{ opacity: twilight < 1 ? day / (1 - twilight) : 0 }} transition={{ duration, ease: [.42, 0, .58, 1] }} />
      <motion.div key={`twilight-${automatic}`} className={`${styles.scene} ${styles.twilight}`} initial={false} animate={{ opacity: automatic ? twilight : 0 }} transition={{ duration }} />
      <motion.div key={`stars-${automatic}`} className={styles.stars} initial={false} animate={{ opacity: night * 0.75 }} transition={{ duration, ease: [.42, 0, .58, 1] }} />
      {solar && city && now ? <SolarCelestial city={city} now={now} moving={visible && preferences.ambientMotion && !reduced} /> : <ManualCelestial target={target} ready={ready} reduced={Boolean(reduced)} />}
      <AmbientSky enabled={ready && visible && preferences.ambientMotion && !reduced} />
      <div className={styles.veil} />
    </div>
  );
}
