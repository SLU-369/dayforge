"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import styles from "./animated-navigation-link.module.css";

const MotionLink = motion.create(Link);

export function AnimatedNavigationLink(props: ComponentProps<typeof MotionLink>) {
  return <MotionLink {...props} initial="rest" whileHover="hover" whileFocus="hover" whileTap="press" />;
}

export function NavigationIcon({ icon: Icon, framed = false }: { icon: LucideIcon; framed?: boolean }) {
  const reduced = useReducedMotion();
  const spring = { type: "spring" as const, stiffness: 260, damping: 22 };
  return (
    <span aria-hidden="true" className={`${styles.icon} ${framed ? styles.framed : ""}`}>
      <motion.span className={styles.glow} variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }} transition={{ duration: reduced ? 0 : 0.25 }} />
      <motion.span className={styles.face} variants={{ rest: { rotateX: 0, y: 0, opacity: 1 }, hover: reduced ? {} : { rotateX: -90, y: -7, opacity: 0 }, press: reduced ? {} : { scale: 0.9 } }} transition={spring}><Icon size={19} /></motion.span>
      <motion.span className={styles.face} variants={{ rest: { rotateX: 90, y: 7, opacity: 0 }, hover: reduced ? { opacity: 0 } : { rotateX: 0, y: 0, opacity: 1 } }} transition={spring}><Icon size={19} /></motion.span>
    </span>
  );
}
