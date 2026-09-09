"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { APPEARANCE_KEY, CAPITALS, DEFAULT_APPEARANCE, SOLAR_CACHE_KEY, THEME_KEY, chooseManualTheme, parseAppearance, solarSnapshot, type AppearancePreferencesV1, type Theme } from "./appearance";
export type { Theme } from "./appearance";

type ThemeContextValue = {
  theme: Theme; preferences: AppearancePreferencesV1; ready: boolean; now: Date | null;
  transitionId: number; setTheme: (theme: Theme) => void; toggleTheme: () => void;
  updatePreferences: (patch: Partial<Pick<AppearancePreferencesV1, "mode" | "cityId" | "ambientMotion">>) => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [preferences, setPreferences] = useState(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [theme, setThemeState] = useState<Theme>("night");
  const [transitionId, setTransitionId] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((next: Theme, animate = false) => {
    if (timer.current) clearTimeout(timer.current);
    setThemeState(next);
    const root = document.documentElement;
    const commit = () => {
      root.dataset.theme = next;
      root.style.colorScheme = next === "night" ? "dark" : "light";
      delete root.dataset.appearancePending;
    };
    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTransitionId((id) => id + 1);
      timer.current = setTimeout(commit, 800);
    } else commit();
    try { localStorage.setItem(THEME_KEY, next); } catch { /* Theme works without storage. */ }
  }, []);

  useEffect(() => {
    function load() {
      const legacy: Theme = document.documentElement.dataset.theme === "day" ? "day" : "night";
      let p = { ...DEFAULT_APPEARANCE, manualTheme: legacy };
      try { p = parseAppearance(localStorage.getItem(APPEARANCE_KEY), localStorage.getItem(THEME_KEY) === "day" ? "day" : legacy); } catch { /* Local fallback. */ }
      setPreferences(p);
      const instant = new Date();
      setNow(instant);
      const city = CAPITALS.find((c) => c.id === p.cityId);
      apply(p.mode === "automatic" && city ? solarSnapshot(instant, city).theme : p.manualTheme);
      setReady(true);
    }
    const frame = requestAnimationFrame(load);
    const tick = () => { if (!document.hidden) setNow(new Date()); };
    const interval = setInterval(tick, 60000);
    const sync = (event: StorageEvent) => { if (event.key === APPEARANCE_KEY || event.key === null) load(); };
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => { cancelAnimationFrame(frame); clearInterval(interval); if (timer.current) clearTimeout(timer.current); window.removeEventListener("storage", sync); document.removeEventListener("visibilitychange", tick); window.removeEventListener("focus", tick); };
  }, [apply]);

  useEffect(() => {
    if (!ready || !now || preferences.mode !== "automatic") return;
    const city = CAPITALS.find((c) => c.id === preferences.cityId);
    if (!city) return;
    const solar = solarSnapshot(now, city);
    const frame = requestAnimationFrame(() => apply(solar.theme));
    try { localStorage.setItem(SOLAR_CACHE_KEY, JSON.stringify(solar.cache)); } catch { /* Optional startup cache. */ }
    return () => cancelAnimationFrame(frame);
  }, [apply, now, preferences, ready]);

  const save = useCallback((next: AppearancePreferencesV1) => {
    setPreferences(next);
    try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(next)); } catch { /* Session preferences still work. */ }
  }, []);
  const setTheme = useCallback((next: Theme) => {
    save(chooseManualTheme(preferences, next));
    apply(next, next !== theme);
  }, [apply, preferences, save, theme]);
  const updatePreferences = useCallback((patch: Partial<Pick<AppearancePreferencesV1, "mode" | "cityId" | "ambientMotion">>) => {
    const next = parseAppearance(JSON.stringify({ ...preferences, ...patch }), theme);
    if (next.mode === "manual" && preferences.mode === "automatic") next.manualTheme = theme;
    save(next);
    setNow(new Date());
  }, [preferences, save, theme]);
  const value = useMemo(() => ({ theme, preferences, ready, now, transitionId, setTheme, updatePreferences, toggleTheme: () => setTheme(theme === "night" ? "day" : "night") }), [theme, preferences, ready, now, transitionId, setTheme, updatePreferences]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
