"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./castle-backdrop.module.css";
import { startSkyVisits, type SkyVisitor } from "./sky-schedule";

export function AmbientSky({ enabled }: { enabled: boolean }) {
  return <>
    <div className={styles.clouds} data-paused={!enabled || undefined}><div /><div /></div>
    {enabled && <OccasionalVisitor />}
  </>;
}

function OccasionalVisitor() {
  const [visitor, setVisitor] = useState<SkyVisitor | null>(null);
  useEffect(() => startSkyVisits(setVisitor), []);
  return <>
    {visitor && <div key={visitor.id} className={styles.visitor} data-kind={visitor.kind} style={{ "--flight-top": `${visitor.top}vh` } as CSSProperties} onAnimationEnd={() => setVisitor(null)}>
      {visitor.kind === "student" ? <svg viewBox="0 0 160 90" fill="currentColor"><path d="m7 67 23-8 16 4-14 10z" /><path d="m26 66 119-18 1 3-118 19z" /><circle cx="90" cy="23" r="7" /><path d="m86 30 11 5 10 15-4 3-13-12-5 13 16 12-4 5-24-15-32 4 18-11 14-13z" /><path d="m87 38 25 5 12-4 2 4-16 5-25-3z" /></svg>
        : visitor.kind === "birds" ? <svg viewBox="0 0 180 70" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 23q9-8 18 3 8-12 18-8M66 40q8-7 16 3 8-11 17-7M120 16q8-6 15 3 8-10 16-6M139 51q6-5 12 2 6-8 13-5" /></svg>
          : <div className={styles.creature} />}
    </div>}
  </>;
}
