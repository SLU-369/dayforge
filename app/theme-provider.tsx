"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "day" | "night";

const THEME_STORAGE_KEY = "dayforge:theme:v1";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function themeFromDocument(): Theme {
  if (typeof document === "undefined") return "night";
  return document.documentElement.dataset.theme === "day" ? "day" : "night";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "night" ? "dark" : "light";
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, setThemeState] = useState<Theme>("night");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setThemeState(themeFromDocument()));

    function syncTheme(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = event.newValue === "day" ? "day" : "night";
      applyTheme(nextTheme);
      setThemeState(nextTheme);
    }

    window.addEventListener("storage", syncTheme);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    function setTheme(nextTheme: Theme) {
      applyTheme(nextTheme);
      setThemeState(nextTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // The visual theme still works when browser storage is unavailable.
      }
    }

    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(themeFromDocument() === "night" ? "day" : "night"),
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
