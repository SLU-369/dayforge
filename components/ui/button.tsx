"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  success?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  success = false,
  icon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`button button-${variant} button-${size} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-success={success || undefined}
      {...props}
    >
      {icon && <span className="button-icon" aria-hidden="true">{icon}</span>}
      <span>{loading ? "Processando…" : children}</span>
    </button>
  );
}
