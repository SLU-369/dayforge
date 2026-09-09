"use client";

import { useTheme } from "./theme-provider";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, ready, preferences } = useTheme();
  const nextTheme = theme === "night" ? "dia" : "noite";

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " compact" : ""}`}
      role="switch"
      aria-label={`Tema ${theme === "night" ? "noturno" : "claro"}. Ativar tema ${nextTheme}`}
      aria-checked={theme === "night"}
      title={`Ativar tema ${nextTheme}${preferences.mode === "automatic" ? " e desativar o automático" : ""}`}
      disabled={!ready}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-icon theme-toggle-day" aria-hidden="true">☀</span>
      <span className="theme-toggle-icon theme-toggle-night" aria-hidden="true">☾</span>
      <span className="theme-toggle-thumb" aria-hidden="true" />
    </button>
  );
}
