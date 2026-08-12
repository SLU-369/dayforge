"use client";

import type { ButtonHTMLAttributes } from "react";

type FlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  text: string;
  tone?: "accent" | "neutral" | "danger";
};

export function FlowButton({
  text,
  tone = "accent",
  type = "button",
  className = "",
  ...props
}: FlowButtonProps) {
  return (
    <button
      type={type}
      className={`flow-button flow-button-${tone} ${className}`.trim()}
      {...props}
    >
      <span className="flow-button-arrow flow-button-arrow-left" aria-hidden="true">→</span>
      <span className="flow-button-label">{text}</span>
      <span className="flow-button-fill" aria-hidden="true" />
      <span className="flow-button-arrow flow-button-arrow-right" aria-hidden="true">→</span>
    </button>
  );
}
