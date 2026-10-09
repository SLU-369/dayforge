import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { canonicalStringify } from "../../persistence/migration/canonical-json.ts";

test.use({ timezoneId: "UTC" });
const date = "2026-10-09", instant = `${date}T12:00:00.000Z`;
const raw = JSON.stringify({ version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
  records: { [date]: { date, items: [{ id: "fictional", title: "Treino fictício", start: "06:30", end: "07:30", category: "saude", notes: "", completed: false }], note: "", energy: 3 } }, monthlyGoals: {} });
const hash = (bridge) => createHash("sha256").update(canonicalStringify(bridge)).digest("hex");
const read = (page) => page.evaluate(() => new Promise((resolve, reject) => {
  const request = indexedDB.open("dayforge-local");
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const db = request.result, tx = db.transaction(["metadata", "plannerDocuments"], "readonly");
    const metadata = tx.objectStore("metadata").get("database"), planner = tx.objectStore("plannerDocuments").get("planner/current"), bridge = tx.objectStore("plannerDocuments").get("execution/bridge");
    tx.oncomplete = () => { db.close(); resolve({ metadata: metadata.result, planner: planner.result, bridge: bridge.result }); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  };
}));
async function open(page) {
  await page.clock.install({ time: new Date(instant) });
  await page.addInitScript((value) => { if (!localStorage.getItem("rotina-369:data:v1")) localStorage.setItem("rotina-369:data:v1", value); }, raw);
  await page.goto("/hoje"); await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("1 itens no dia");
}
async function backup(page) {
  await page.goto("/configuracoes/dados-e-backup");
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Exportar arquivo", exact: true }).click();
  return JSON.parse(await readFile(await (await download).path(), "utf8"));
}
async function restore(page, data) {
  await expect(page.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({ name: "planning-fictional.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(data)) });
  await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");
  await page.goto("/hoje"); await page.reload();
  await expect(page.locator(".storage-warning")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Reagendar/i })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
}
test("old installed bridge upgrades without changing planner or marker; old backup restores as bridge v2", async ({ page }) => {
  await open(page); const saved = await read(page), marker = await page.evaluate(() => localStorage.getItem("dayforge:persistence:v2"));
  saved.bridge.payload.version = 1; saved.bridge.formatVersion = 1; saved.bridge.sourceContentFingerprint = hash(saved.bridge.payload);
  saved.metadata.executionBridgeVersion = 1; delete saved.metadata.authorityEpoch;
  await page.evaluate((seed) => new Promise((resolve, reject) => {
    const request = indexedDB.open("dayforge-local"); request.onerror = () => reject(request.error);
    request.onsuccess = () => { const db = request.result, tx = db.transaction(["metadata", "plannerDocuments"], "readwrite");
      tx.objectStore("metadata").put(seed.metadata); tx.objectStore("plannerDocuments").put(seed.bridge);
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); }; };
  }), saved);
  await page.reload(); await expect(page.locator(".storage-warning")).toHaveCount(0);
  await expect.poll(async () => (await read(page)).metadata.executionBridgeVersion).toBe(2);
  const adopted = await read(page); expect(adopted.planner).toEqual(saved.planner); expect(adopted.metadata.authorityEpoch).toBe(0);
  expect(adopted.bridge.payload).toEqual({ ...saved.bridge.payload, version: 2 });
  expect(await page.evaluate(() => localStorage.getItem("dayforge:persistence:v2"))).toBe(marker);
  const data = await backup(page); data.payload.executionBridge.bridge.version = 1;
  data.payload.executionBridge.contentFingerprint = hash(data.payload.executionBridge.bridge);
  await restore(page, data); const restored = await read(page);
  expect(restored.bridge.payload).toEqual(adopted.bridge.payload); expect(restored.metadata.authorityEpoch).toBe(1);
  expect(restored.planner).toEqual(saved.planner);
});
test("audited bridge round-trips in the existing backup UI without a rescheduling producer", async ({ page }) => {
  await open(page); const data = await backup(page), bridge = data.payload.executionBridge.bridge;
  const schedule = { kind: "timed", startsAt: `${date}T06:30:00.000Z`, durationMinutes: 60, timeZone: "UTC" };
  bridge.entries[0].planningAudit = { baselineItem: structuredClone(bridge.entries[0].item), baselineSchedule: schedule, confirmedAt: instant,
    rescheduleHistory: [{ id: "reschedule:occ:1:1", from: schedule, to: { ...schedule, startsAt: `${date}T20:00:00.000Z` }, changedAt: instant }] };
  data.payload.executionBridge.contentFingerprint = hash(bridge);
  await restore(page, data); const saved = await read(page); expect(saved.bridge.payload).toEqual(bridge);
  const exported = await backup(page); expect(exported.payload).toEqual(data.payload);
  expect(exported.formatVersion).toBe(2); expect(exported.exportedFrom).toEqual({ persistenceGeneration: 2, schemaVersion: 1 });
  expect(JSON.stringify(exported)).not.toContain("authorityEpoch");
  await restore(page, exported); const restored = await read(page);
  expect(restored.metadata.authorityEpoch).toBe(saved.metadata.authorityEpoch + 1);
  expect(restored.bridge).toEqual(saved.bridge); expect(restored.planner).toEqual(saved.planner);
});
