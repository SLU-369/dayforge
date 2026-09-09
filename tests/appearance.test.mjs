import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../app/appearance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace('"suncalc"', JSON.stringify(import.meta.resolve("suncalc")));
const { CAPITALS, parseAppearance, chooseManualTheme, solarSnapshot, lightWeights, bootstrapAppearance, celestialFrame, THEME_TRANSITION_MS, APPEARANCE_KEY, THEME_KEY, SOLAR_CACHE_KEY } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const scheduleSource = readFileSync(new URL("../components/appearance/sky-schedule.ts", import.meta.url), "utf8");
const scheduleCompiled = ts.transpileModule(scheduleSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { startSkyVisits } = await import(`data:text/javascript;base64,${Buffer.from(scheduleCompiled).toString("base64")}`);

test("timers nativos não recebem o adaptador como receiver", (t) => {
  t.mock.method(globalThis, "setTimeout", function () { assert.ok(this === undefined || this === globalThis); return 1; });
  t.mock.method(globalThis, "clearTimeout", function () { assert.ok(this === undefined || this === globalThis); });
  const stop = startSkyVisits(() => {});
  stop();
});

test("transição manual usa trajetória contínua, reversível e sem sol residual", () => {
  assert.equal(THEME_TRANSITION_MS, 3600);
  const frames = Array.from({ length: 101 }, (_, i) => celestialFrame(i / 100));
  for (let i = 1; i < frames.length; i++) {
    assert.ok(frames[i].x > frames[i - 1].x);
    assert.ok(Math.abs(frames[i].x - frames[i - 1].x - .432) < 1e-10);
    assert.ok(Math.abs(frames[i].y - frames[i - 1].y) < .12);
    assert.ok(frames[i].sun < frames[i - 1].sun);
    assert.ok(frames[i].moon > frames[i - 1].moon);
  }
  assert.equal(frames.at(-1).sun, 0);
  assert.equal(frames[0].moon, 0);
  assert.deepEqual(celestialFrame(-1), frames[0]);
  assert.deepEqual(celestialFrame(2), frames.at(-1));
  assert.deepEqual(frames.slice().reverse()[37], celestialFrame(.63));
});

test("sol automático avança de manhã ao meio-dia e colore o crepúsculo", () => {
  const city = CAPITALS.find((c) => c.id === "sao-paulo");
  const morning = solarSnapshot(new Date("2026-09-08T08:00:00-03:00"), city);
  const noon = solarSnapshot(new Date("2026-09-08T12:00:00-03:00"), city);
  const nextMinute = solarSnapshot(new Date("2026-09-08T12:01:00-03:00"), city);
  const dusk = solarSnapshot(noon.sunset, city);
  assert.ok(morning.sunPosition.x < noon.sunPosition.x);
  assert.ok(morning.sunPosition.y > noon.sunPosition.y);
  assert.ok(Math.abs(noon.sunPosition.x - 50) < 3);
  assert.ok(nextMinute.sunPosition.x > noon.sunPosition.x);
  assert.ok(nextMinute.sunPosition.x - noon.sunPosition.x < .2);
  assert.equal(noon.weights.twilight, 0);
  assert.ok(dusk.weights.twilight > .8);
  assert.ok(dusk.sunPosition.opacity > 0, "sol permanece visível no horizonte alaranjado");
});

test("visitas ocasionais deixam intervalos vazios, não repetem espécie e cancelam timers", () => {
  const pending = new Map();
  const visits = [];
  let id = 0;
  const clock = { random: () => 0, now: () => id, later: (fn, delay) => { pending.set(++id, { fn, delay }); return id; }, cancel: (id) => pending.delete(id) };
  const advance = () => { const [key, entry] = pending.entries().next().value; pending.delete(key); entry.fn(); return entry.delay; };
  const stop = startSkyVisits((v) => visits.push(v), clock);
  assert.equal(visits.length, 0);
  assert.equal(advance(), 12000);
  assert.equal(visits.at(-1).kind, "birds");
  assert.equal(advance(), 24000);
  assert.equal(visits.at(-1), null);
  assert.equal(advance(), 55000);
  assert.equal(visits.at(-1).kind, "hippogriff");
  const stale = pending.values().next().value.fn;
  stop();
  assert.equal(pending.size, 0);
  const count = visits.length;
  stale();
  assert.equal(visits.length, count, "callbacks já enfileirados não retomam visitas após pausa");
});

test("preferências legadas, inválidas e futuras preservam o tema manual", () => {
  for (const raw of [null, "{broken", "null", "[]", '{"version":2}']) {
    const result = parseAppearance(raw, "day");
    assert.equal(result.manualTheme, "day");
    assert.equal(result.mode, "manual");
  }
  const result = parseAppearance(JSON.stringify({ version: 1, mode: "automatic", cityId: "invalid", ambientMotion: false }), "night");
  assert.equal(result.mode, "manual");
  assert.equal(result.cityId, null);
  assert.equal(result.ambientMotion, false);
});

test("troca manual desativa automático sem perder cidade ou movimento", () => {
  const preferences = parseAppearance(JSON.stringify({ version: 1, mode: "automatic", cityId: "sao-paulo", manualTheme: "night", ambientMotion: false }), "day");
  const next = chooseManualTheme(preferences, "day");
  assert.equal(next.mode, "manual");
  assert.equal(next.manualTheme, "day");
  assert.equal(next.cityId, "sao-paulo");
  assert.equal(next.ambientMotion, false);
  assert.equal(preferences.mode, "automatic", "não muta a preferência anterior");
  assert.deepEqual(parseAppearance(JSON.stringify(next), "night"), next);
});

test("27 capitais, fusos válidos e eventos futuros após meia-noite", () => {
  assert.equal(CAPITALS.length, 27);
  assert.equal(new Set(CAPITALS.map((c) => c.id)).size, 27);
  for (const city of CAPITALS) {
    for (const instant of ["2026-01-01T04:30:00Z", "2026-06-21T22:00:00Z", "2026-09-08T15:00:00Z"]) {
      const now = new Date(instant);
      const solar = solarSnapshot(now, city);
      assert.ok(solar.nextSunrise > now, city.id);
      assert.ok(solar.nextSunset > now, city.id);
      assert.ok(solar.cache.until > now.getTime());
      assert.ok(solar.nextSunrise - now < 25 * 3600000);
      assert.ok(solar.nextSunset - now < 25 * 3600000);
      assert.ok(Number.isFinite(solar.altitude));
    }
  }
});

test("tema muda no nascer e pôr do sol e a luz cruza o crepúsculo", () => {
  const city = CAPITALS.find((c) => c.id === "sao-paulo");
  const { sunrise, sunset } = solarSnapshot(new Date("2026-09-08T15:00Z"), city);
  assert.equal(solarSnapshot(new Date(+sunrise - 1000), city).theme, "night");
  assert.equal(solarSnapshot(new Date(+sunrise + 1000), city).theme, "day");
  assert.equal(solarSnapshot(new Date(+sunset - 1000), city).theme, "day");
  assert.equal(solarSnapshot(new Date(+sunset + 1000), city).theme, "night");
  for (let altitude = -90; altitude <= 90; altitude += .5) {
    const weights = lightWeights(altitude);
    assert.equal(weights.day + weights.twilight + weights.night, 1);
    assert.ok(Object.values(weights).every((n) => n >= 0 && n <= 1));
  }
  assert.equal(lightWeights(0).twilight, 1);
  assert.equal(lightWeights(30).day, 1);
  assert.equal(lightWeights(-20).night, 1);
});

function bootstrap(entries = {}, blocked = false) {
  const root = { dataset: {}, style: {} };
  const data = new Map(Object.entries(entries));
  vm.runInNewContext(`(${bootstrapAppearance.toString()})()`, {
    document: { documentElement: root },
    window: { matchMedia: () => ({ matches: false }), setTimeout() {} },
    localStorage: { getItem(key) { if (blocked) throw new Error("blocked"); return data.get(key) ?? null; } },
  });
  return root;
}

test("bootstrap restaura manual e cache solar sem tocar no payload do planner", () => {
  assert.equal(bootstrap({ [THEME_KEY]: "night" }).dataset.theme, "night");
  assert.equal(bootstrap({}, true).dataset.theme, "day");
  const p = { version: 1, mode: "automatic", cityId: "sao-paulo", manualTheme: "day" };
  const cache = { cityId: p.cityId, from: Date.now() - 10000, until: Date.now() + 10000, theme: "night" };
  assert.equal(bootstrap({ [APPEARANCE_KEY]: JSON.stringify(p), [SOLAR_CACHE_KEY]: JSON.stringify(cache) }).dataset.theme, "night");
  cache.until = Date.now() - 1;
  assert.equal(bootstrap({ [APPEARANCE_KEY]: JSON.stringify(p), [SOLAR_CACHE_KEY]: JSON.stringify(cache) }).dataset.appearancePending, "true");
  p.mode = "manual";
  assert.equal(bootstrap({ [APPEARANCE_KEY]: JSON.stringify(p), [THEME_KEY]: "night" }).dataset.theme, "day");
  const provider = readFileSync(new URL("../app/theme-provider.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source + provider, /rotina-369:data:v1/);
});
