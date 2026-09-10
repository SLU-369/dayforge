import { getPosition, getTimes } from "suncalc";

export type Theme = "day" | "night";
export const THEME_TRANSITION_MS = 3600;

// A single reversible phase keeps the two celestial faces on the same path.
export function celestialFrame(phase: number, sunX = 34.8, sunY = 15.73) {
  const p = Math.max(0, Math.min(1, phase));
  return {
    x: sunX + (78 - sunX) * p,
    y: sunY + (14 - sunY) * p - 3 * Math.sin(Math.PI * p),
    sun: 0.7 * (1 - p),
    moon: 0.8 * p,
  };
}
export type ThemeMode = "manual" | "automatic";
export type Capital = { id: string; name: string; state: string; latitude: number; longitude: number; timeZone: string };
export const CAPITALS: readonly Capital[] = [
  ["aracaju", "Aracaju", "SE", -10.91, -37.07, "America/Maceio"],
  ["belem", "Belém", "PA", -1.46, -48.5, "America/Belem"],
  ["belo-horizonte", "Belo Horizonte", "MG", -19.92, -43.94, "America/Sao_Paulo"],
  ["boa-vista", "Boa Vista", "RR", 2.82, -60.67, "America/Boa_Vista"],
  ["brasilia", "Brasília", "DF", -15.79, -47.88, "America/Sao_Paulo"],
  ["campo-grande", "Campo Grande", "MS", -20.47, -54.62, "America/Campo_Grande"],
  ["cuiaba", "Cuiabá", "MT", -15.6, -56.1, "America/Cuiaba"],
  ["curitiba", "Curitiba", "PR", -25.43, -49.27, "America/Sao_Paulo"],
  ["florianopolis", "Florianópolis", "SC", -27.6, -48.55, "America/Sao_Paulo"],
  ["fortaleza", "Fortaleza", "CE", -3.72, -38.54, "America/Fortaleza"],
  ["goiania", "Goiânia", "GO", -16.68, -49.25, "America/Sao_Paulo"],
  ["joao-pessoa", "João Pessoa", "PB", -7.12, -34.86, "America/Fortaleza"],
  ["macapa", "Macapá", "AP", 0.03, -51.07, "America/Belem"],
  ["maceio", "Maceió", "AL", -9.67, -35.74, "America/Maceio"],
  ["manaus", "Manaus", "AM", -3.12, -60.02, "America/Manaus"],
  ["natal", "Natal", "RN", -5.79, -35.21, "America/Fortaleza"],
  ["palmas", "Palmas", "TO", -10.18, -48.33, "America/Araguaina"],
  ["porto-alegre", "Porto Alegre", "RS", -30.03, -51.23, "America/Sao_Paulo"],
  ["porto-velho", "Porto Velho", "RO", -8.76, -63.9, "America/Porto_Velho"],
  ["recife", "Recife", "PE", -8.05, -34.88, "America/Recife"],
  ["rio-branco", "Rio Branco", "AC", -9.97, -67.81, "America/Rio_Branco"],
  ["rio-de-janeiro", "Rio de Janeiro", "RJ", -22.91, -43.17, "America/Sao_Paulo"],
  ["salvador", "Salvador", "BA", -12.97, -38.5, "America/Bahia"],
  ["sao-luis", "São Luís", "MA", -2.53, -44.3, "America/Fortaleza"],
  ["sao-paulo", "São Paulo", "SP", -23.55, -46.63, "America/Sao_Paulo"],
  ["teresina", "Teresina", "PI", -5.09, -42.8, "America/Fortaleza"],
  ["vitoria", "Vitória", "ES", -20.32, -40.34, "America/Sao_Paulo"],
].map(([id, name, state, latitude, longitude, timeZone]) => ({ id: String(id), name: String(name), state: String(state), latitude: Number(latitude), longitude: Number(longitude), timeZone: String(timeZone) }));

export type AppearancePreferencesV1 = { version: 1; mode: ThemeMode; manualTheme: Theme; cityId: string | null; ambientMotion: boolean };
export const APPEARANCE_KEY = "dayforge:appearance:v1";
export const THEME_KEY = "dayforge:theme:v1";
export const SOLAR_CACHE_KEY = "dayforge:solar-cache:v1";
export const DEFAULT_APPEARANCE: AppearancePreferencesV1 = { version: 1, mode: "manual", manualTheme: "night", cityId: null, ambientMotion: true };

export function parseAppearance(raw: string | null, legacyTheme: Theme): AppearancePreferencesV1 {
  const fallback = { ...DEFAULT_APPEARANCE, manualTheme: legacyTheme };
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1) return fallback;
    const p = value as Partial<AppearancePreferencesV1>;
    const cityId = CAPITALS.some((city) => city.id === p.cityId) ? p.cityId! : null;
    return { version: 1, mode: p.mode === "automatic" && cityId ? "automatic" : "manual", cityId,
      manualTheme: p.manualTheme === "day" || p.manualTheme === "night" ? p.manualTheme : legacyTheme, ambientMotion: p.ambientMotion !== false };
  } catch { return fallback; }
}

export function chooseManualTheme(preferences: AppearancePreferencesV1, theme: Theme): AppearancePreferencesV1 {
  return { ...preferences, mode: "manual", manualTheme: theme };
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smoothstep = (from: number, to: number, value: number) => {
  const progress = clamp((value - from) / (to - from));
  return progress * progress * (3 - 2 * progress);
};

export function castleSunVisibility(progress: number) {
  // The photographic composition places the first visible towers well before
  // solar noon. Fade the disc behind that silhouette early and bring it back
  // only after the western towers clear it; daylight weights remain untouched.
  const behindCentralCastle = smoothstep(0.03, 0.13, progress) * (1 - smoothstep(0.74, 0.88, progress));
  return 1 - behindCentralCastle * 0.98;
}

export function lightWeights(altitude: number) {
  const day = clamp(altitude / 8);
  const night = clamp(-altitude / 6);
  return { day, night, twilight: 1 - day - night };
}

export function solarSnapshot(now: Date, city: Capital) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: city.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const noon = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  const times = getTimes(noon, city.latitude, city.longitude);
  const tomorrow = getTimes(new Date(noon.getTime() + 86400000), city.latitude, city.longitude);
  const sunrise = times.sunrise!;
  const sunset = times.sunset!;
  const theme: Theme = now >= sunrise && now < sunset ? "day" : "night";
  const altitude = getPosition(now, city.latitude, city.longitude).altitude;
  const progress = clamp((now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime()));
  const nextSunrise = now < sunrise ? sunrise : tomorrow.sunrise!;
  const nextSunset = now < sunset ? sunset : tomorrow.sunset!;
  const sunPosition = { x: 12 + progress * 76, y: 40 - Math.sin(progress * Math.PI) * 30, opacity: 0.7 * clamp((altitude + 6) / 8) * castleSunVisibility(progress) };
  return { theme, altitude, progress, sunPosition, weights: lightWeights(altitude), sunrise, sunset, nextSunrise, nextSunset,
    cache: { cityId: city.id, from: now.getTime(), until: Math.min(nextSunrise.getTime(), nextSunset.getTime()), theme } };
}

// Serialized into the head: keep independent from module-level identifiers.
export function bootstrapAppearance() {
  const root = document.documentElement;
  let theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
  try {
    const legacy = localStorage.getItem("dayforge:theme:v1");
    if (legacy === "day" || legacy === "night") theme = legacy;
    const p = JSON.parse(localStorage.getItem("dayforge:appearance:v1") || "null");
    if (p?.version === 1 && p.mode === "manual" && (p.manualTheme === "day" || p.manualTheme === "night")) theme = p.manualTheme;
    if (p?.version === 1 && p.mode === "automatic") {
      const cache = JSON.parse(localStorage.getItem("dayforge:solar-cache:v1") || "null");
      const now = Date.now();
      if (cache?.cityId === p.cityId && now >= cache.from && now < cache.until && (cache.theme === "day" || cache.theme === "night")) theme = cache.theme;
      else root.dataset.appearancePending = "true";
    }
  } catch { /* Storage restrictions must not prevent first paint. */ }
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "night" ? "dark" : "light";
  window.setTimeout(() => { delete root.dataset.appearancePending; }, 1500);
}
