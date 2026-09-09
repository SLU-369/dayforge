"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, type ComponentProps } from "react";
import styles from "./animated-navigation-link.module.css";

export function AnimatedNavigationLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />;
}

export function NavigationIcon({ icon: Icon, framed = false }: { icon: LucideIcon; framed?: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    svg.current?.querySelectorAll<SVGGeometryElement>("path, line, rect, circle, ellipse, polyline, polygon").forEach((stroke, index) => {
      stroke.setAttribute("pathLength", "1");
      stroke.setAttribute("data-draw-stroke", "");
      stroke.style.setProperty("--stroke-delay", `${Math.min(index, 10) * 35}ms`);
    });
  }, [Icon]);
  return (
    <span aria-hidden="true" className={`${styles.icon} ${framed ? styles.framed : ""}`}>
      <span className={styles.glow} />
      <Icon ref={svg} size={19} className={styles.drawing} />
    </span>
  );
}
