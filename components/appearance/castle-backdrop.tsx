"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { CAPITALS, solarSnapshot } from "@/app/appearance";
import { useTheme } from "@/app/theme-provider";
import { AmbientSky } from "./ambient-sky";
import styles from "./castle-backdrop.module.css";

export function CastleBackdrop() {
  const { theme, preferences, ready, now, transitionId } = useTheme();
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
  const duration = reduced || !ready ? 0 : solar ? 4 : 1.8;
  const progress = solar?.progress ?? 0.3;
  const x = `${12 + progress * 76}vw`;
  const y = `${40 - Math.sin(progress * Math.PI) * 30}vh`;
  const manualPassage = transitionId > 0 && !solar && !reduced;
  return (
    <div className={styles.backdrop} data-ready={ready || undefined} data-theme={theme} aria-hidden="true">
      <div className={`${styles.scene} ${styles.night} theme-backdrop-night`} />
      <motion.div className={`${styles.scene} ${styles.day} theme-backdrop-day`} initial={false} animate={{ opacity: twilight < 1 ? day / (1 - twilight) : 0 }} transition={{ duration }} />
      <motion.div key={`twilight-${transitionId}`} className={`${styles.scene} ${styles.twilight}`} initial={transitionId && !solar ? { opacity: 0 } : false} animate={{ opacity: transitionId && !solar && !reduced ? [0, 0.75, 0] : twilight }} transition={{ duration }} />
      <motion.div className={styles.stars} initial={false} animate={{ opacity: night * 0.75 }} transition={{ duration }} />
      <motion.div key={`sun-${transitionId}`} className={styles.sun} initial={manualPassage ? { opacity: 0 } : false} animate={manualPassage ? {
        opacity: [theme === "night" ? 0.7 : 0, 0.9, theme === "day" ? 0.7 : 0],
        x: theme === "night" ? [x, "55vw", "90vw"] : ["90vw", "55vw", x],
        y: theme === "night" ? [y, "6vh", "40vh"] : ["40vh", "6vh", y],
      } : { x, y, opacity: day * 0.7 }} transition={{ duration, ease: "easeInOut" }} />
      <motion.div className={styles.moon} initial={false} animate={{ opacity: night * 0.8 }} transition={{ duration }} />
      <AmbientSky enabled={ready && visible && preferences.ambientMotion && !reduced} />
      <div className={styles.veil} />
    </div>
  );
}
