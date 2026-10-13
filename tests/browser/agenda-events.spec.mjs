import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { canonicalStringify } from "../../persistence/migration/canonical-json.ts";
import { createOccurrence, createDateOnlySchedule, createAllDaySchedule, scheduleOccurrenceId } from "../../domain/temporal/index.ts";
test.use({ timezoneId: "UTC" });
const instant = "2026-10-12T12:00:00.000Z", day = "2026-11-02";
const state = { version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
  records: { "2026-10-12": { date: "2026-10-12", items: [{ id: "fictional", title: "Legado fictício", start: "08:00", end: "09:00", category: "estudo", notes: "", completed: false }], note: "", energy: 3 } }, monthlyGoals: {} };
const read = page => page.evaluate(() => new Promise((resolve, reject) => {
  const request = indexedDB.open("dayforge-local"); request.onerror = () => reject(request.error);
  request.onsuccess = () => { const db = request.result, tx = db.transaction(["metadata", "plannerDocuments"], "readonly"), metadata = tx.objectStore("metadata").get("database"), planner = tx.objectStore("plannerDocuments").get("planner/current"), bridge = tx.objectStore("plannerDocuments").get("execution/bridge");
    tx.oncomplete = () => { db.close(); resolve({ metadata: metadata.result, planner: planner.result, bridge: bridge.result }); }; tx.onerror = () => reject(tx.error); };
}));
async function setup(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.setFixedTime(new Date(instant));
  await page.addInitScript(raw => { if (!localStorage.getItem("dayforge:persistence:v2")) localStorage.setItem("rotina-369:data:v1", raw); }, JSON.stringify(state));
  await page.goto("/planejamento/agenda"); await expect(page.getByRole("button", { name: "Novo evento", exact: true })).toBeEnabled();
  await page.getByLabel("Data consultada", { exact: true }).fill(day);
}
async function open(page, title = "Evento fictício") {
  await page.getByRole("button", { name: "Novo evento", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible(); await page.getByLabel("Título do evento", { exact: true }).fill(title);
  await page.getByLabel("Flexibilidade", { exact: true }).selectOption("fixed");
  await page.getByLabel("Início planejado", { exact: true }).fill(`${day}T23:00`); await page.getByLabel("Fim planejado", { exact: true }).fill("2026-11-03T01:00");
}
async function submit(page) {
  await page.getByRole("button", { name: "Criar evento", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
}
const entries = snapshot => snapshot.bridge.payload.entries.filter(entry => entry.kind === "canonical");
const val = result => { expect(result.ok).toBe(true); return result.value; };
async function recoveredUntimed(page) {
  await page.goto("/configuracoes/dados-e-backup"); await expect(page.getByRole("button", { name: "Exportar arquivo", exact: true })).toBeEnabled();
  const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: "Exportar arquivo", exact: true }).click();
  const backup = JSON.parse(await readFile(await (await downloading).path(), "utf8")), bridge = backup.payload.executionBridge.bridge;
  for (const kind of ["date_only", "all_day"]) {
    const schedule = kind === "date_only" ? val(createDateOnlySchedule({ date: day, timeZone: "UTC" }))
      : val(createAllDaySchedule({ startsOn: day, endsBefore: "2026-11-04", timeZone: "UTC" }));
    const occurrence = val(createOccurrence({ id: val(scheduleOccurrenceId(`occ:${bridge.nextSequence++}`)), source: {
      kind: "standalone", title: `Evento ${kind}`, flexibility: "flexible", origin: { kind: "event" } }, schedule, createdAt: instant }));
    bridge.entries.push({ kind: "canonical", occurrence });
  }
  backup.payload.executionBridge.contentFingerprint = createHash("sha256").update(canonicalStringify(bridge)).digest("hex");
  await page.locator('input[type="file"]').setInputFiles({ name: "fictional-untimed.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");
  await page.goto("/planejamento/agenda"); await expect(page.getByRole("button", { name: "Novo evento", exact: true })).toBeEnabled();
  await page.getByLabel("Data consultada", { exact: true }).fill(day);
}
async function pauseHash(page) {
  await page.evaluate(() => { const original = crypto.subtle.digest.bind(crypto.subtle); let first = true;
    window.creationHashEntered = false; crypto.subtle.digest = async (...args) => {
      if (first) { first = false; window.creationHashEntered = true; await new Promise(resolve => window.releaseCreationHash = resolve); }
      return original(...args);
    };
  });
}

test("creates an independent timed event, midnight query and backup 3 round-trip without changing legacy", async ({ page }) => {
  await setup(page); const before = await read(page); await open(page); await submit(page);
  await expect(page.getByRole("region", { name: "Eventos da data", exact: true })).toContainText("Evento fictício");
  const after = await read(page); expect(after.metadata.datasetRevision).toBe(before.metadata.datasetRevision + 1); expect(after.metadata.authorityEpoch).toBe(before.metadata.authorityEpoch);
  expect(after.planner).toEqual(before.planner); expect(entries(after)[0].occurrence.id).toBe("occ:2"); expect(entries(after)[0].occurrence.execution).toBeNull();
  await page.getByLabel("Data consultada", { exact: true }).fill("2026-11-03"); await expect(page.getByRole("region", { name: "Eventos da data" })).toContainText("Evento fictício");
  await page.reload(); await expect(page.getByRole("button", { name: "Novo evento", exact: true })).toBeEnabled(); await page.getByLabel("Data consultada", { exact: true }).fill(day);
  await expect(page.getByRole("region", { name: "Eventos da data" })).toContainText("Evento fictício");
  await page.goto("/configuracoes/dados-e-backup"); await expect(page.getByRole("button", { name: "Exportar arquivo", exact: true })).toBeEnabled();
  const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: "Exportar arquivo", exact: true }).click(); const backup = JSON.parse(await readFile(await (await downloading).path(), "utf8"));
  expect(backup.formatVersion).toBe(3); expect(backup.payload.executionBridge.bridge).toEqual(after.bridge.payload);
  await page.locator('input[type="file"]').setInputFiles({ name: "fictional-agenda.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByRole("status")).toContainText("Backup importado com sucesso"); expect((await read(page)).bridge).toEqual(after.bridge);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(JSON.stringify(state));
});

test("recovered date-only and all-day events retain types and exclusive final date, without creation controls", async ({ page }) => {
  await setup(page); await recoveredUntimed(page); const saved = await read(page);
  await expect(page.getByRole("region", { name: "Eventos da data" })).toContainText("Evento date_only");
  await expect(page.getByRole("region", { name: "Eventos da data" })).toContainText("Evento all_day");
  await page.getByLabel("Data consultada", { exact: true }).fill("2026-11-03"); await expect(page.getByRole("region", { name: "Eventos da data" })).not.toContainText("Evento date_only");
  await expect(page.getByRole("region", { name: "Eventos da data" })).toContainText("Evento all_day");
  await page.getByLabel("Data consultada", { exact: true }).fill("2026-11-04"); await expect(page.getByText("Nenhum evento canônico nesta data.", { exact: true })).toBeVisible();
  expect(entries(await read(page)).map(entry => entry.occurrence.currentSchedule.kind)).toEqual(["date_only", "all_day"]);
  await open(page); await expect(page.getByLabel("Tipo de planejamento", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Fim planejado", { exact: true })).toBeVisible(); await page.keyboard.press("Escape");
  expect(await read(page)).toEqual(saved);
});

test("double click confirms once; a second deliberate similar event receives another identity", async ({ page }) => {
  await setup(page); await open(page); await pauseHash(page); const before = await read(page);
  await page.getByRole("button", { name: "Criar evento", exact: true }).dblclick({ delay: 10 });
  await expect.poll(() => page.evaluate(() => window.creationHashEntered)).toBe(true);
  await page.evaluate(() => window.releaseCreationHash()); await expect(page.getByRole("dialog")).toHaveCount(0);
  const once = await read(page); expect(entries(once)).toHaveLength(1); expect(once.metadata.datasetRevision).toBe(before.metadata.datasetRevision + 1);
  await open(page); await submit(page); const twice = await read(page); expect(entries(twice).map(entry => entry.occurrence.id)).toEqual(["occ:2", "occ:3"]);
});

test("real overlapping creation in two tabs rejects the stale loser without discarding fields", async ({ page, context }) => {
  await setup(page); const other = await context.newPage(); await other.clock.setFixedTime(new Date(instant));
  await other.goto("/planejamento/agenda"); await expect(other.getByRole("button", { name: "Novo evento", exact: true })).toBeEnabled(); await other.getByLabel("Data consultada", { exact: true }).fill(day);
  await open(page, "Intenção concorrente A"); await open(other, "Intenção concorrente B"); await pauseHash(page);
  await page.getByRole("button", { name: "Criar evento", exact: true }).click(); await expect.poll(() => page.evaluate(() => window.creationHashEntered)).toBe(true);
  await submit(other); const winner = await read(other); await page.evaluate(() => window.releaseCreationHash());
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible(); await expect(page.getByLabel("Título do evento", { exact: true })).toHaveValue("Intenção concorrente A");
  expect(await read(page)).toEqual(winner); expect(entries(winner)).toHaveLength(1); expect(entries(winner)[0].occurrence.title).toBe("Intenção concorrente B");
});

test("created timed event is readable in Hoje without complete-occurrence commands", async ({ page }) => {
  await setup(page); await open(page, "Compromisso de Hoje");
  await page.getByLabel("Início planejado", { exact: true }).fill("2026-10-12T20:00"); await page.getByLabel("Fim planejado", { exact: true }).fill("2026-10-12T21:00"); await submit(page);
  const saved = await read(page); await page.goto("/hoje"); await expect(page.getByRole("region", { name: "Próximo", exact: true })).toContainText("Compromisso de Hoje");
  await expect(page.getByRole("button", { name: "Concluir Compromisso de Hoje", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reagendar Compromisso de Hoje", exact: true })).toHaveCount(0); expect(await read(page)).toEqual(saved);
});

test("stale form survives a different tab's creation and requires explicit resolution", async ({ page, context }) => {
  await setup(page); const other = await context.newPage(); await other.clock.setFixedTime(new Date(instant));
  await other.goto("/planejamento/agenda"); await expect(other.getByRole("button", { name: "Novo evento", exact: true })).toBeEnabled(); await other.getByLabel("Data consultada", { exact: true }).fill(day);
  await open(page, "Rascunho fictício preservado"); await open(other, "Evento vencedor"); await submit(other);
  await expect(page.getByRole("alert", { name: "Alterações locais preservadas" })).toBeVisible();
  await page.getByRole("button", { name: "Criar evento", exact: true }).click(); await expect(page.getByRole("dialog")).toContainText("O planejamento mudou");
  await expect(page.getByLabel("Título do evento", { exact: true })).toHaveValue("Rascunho fictício preservado"); expect(entries(await read(page))).toHaveLength(1);
  const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: "Baixar rascunho do evento", exact: true }).click();
  const draft = JSON.parse(await readFile(await (await downloading).path(), "utf8")); expect(draft.format).toBe("dayforge-event-draft"); expect(draft.fields.title).toBe("Rascunho fictício preservado"); expect(draft.fields.planning.start).toBe(`${day}T23:00`);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click(); page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Carregar versão salva", exact: true }).click(); await expect(page.getByRole("alert", { name: "Alterações locais preservadas" })).toHaveCount(0);
  await open(page, "Rascunho reaplicado"); await submit(page); expect(entries(await read(page)).map(entry => entry.occurrence.id)).toEqual(["occ:2", "occ:3"]);
  await expect(page.locator(".storage-warning")).toHaveCount(0);
});

test("failed write preserves form and unchanged retry keeps the original confirmation instant", async ({ page }) => {
  await setup(page); const before = await read(page); await open(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, ...args) {
      if (value?.id === "execution/bridge") { IDBObjectStore.prototype.put = original; throw new DOMException("Fixture quota", "QuotaExceededError"); }
      return original.call(this, value, ...args);
    };
  });
  await page.getByRole("button", { name: "Criar evento", exact: true }).click(); await expect(page.getByRole("dialog")).toContainText("Não foi possível confirmar o evento");
  expect(await read(page)).toEqual(before); await expect(page.getByLabel("Título do evento", { exact: true })).toHaveValue("Evento fictício");
  await page.clock.setFixedTime(new Date("2026-10-12T13:00:00.000Z")); await submit(page);
  expect(entries(await read(page))[0].occurrence.createdAt).toBe(instant); await expect(page.locator(".storage-warning")).toHaveCount(0);
  await expect(page.getByRole("alert", { name: "Alterações locais preservadas" })).toHaveCount(0);
});

test("new creation rejects offsets and DST ambiguity without a persisted fact", async ({ page }) => {
  await setup(page); const before = await read(page); await open(page);
  await page.getByLabel("Fuso IANA do evento", { exact: true }).fill("+03:00"); await page.getByRole("button", { name: "Criar evento", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("identificador IANA"); expect(await read(page)).toEqual(before);
  await page.getByLabel("Fuso IANA do evento", { exact: true }).fill("America/New_York"); await page.getByLabel("Início planejado", { exact: true }).fill("2026-11-01T01:30"); await page.getByLabel("Fim planejado", { exact: true }).fill("2026-11-01T03:00");
  await page.getByRole("button", { name: "Criar evento", exact: true }).click(); await expect(page.getByRole("dialog")).toContainText("inexistente ou ambíguo"); expect(await read(page)).toEqual(before);
});

test("restore in another page rejects the old creation authority and preserves form fields", async ({ page, context }) => {
  await setup(page); await open(page, "Intenção da autoridade anterior");
  const other = await context.newPage(); await other.goto("/configuracoes/dados-e-backup");
  await expect(other.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeEnabled();
  await other.locator('input[type="file"]').setInputFiles({ name: "fictional-v1.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state)) });
  await expect(other.getByRole("status")).toContainText("Backup importado com sucesso"); const replaced = await read(other);
  await page.getByRole("button", { name: "Criar evento", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible(); await expect(page.getByLabel("Título do evento", { exact: true })).toHaveValue("Intenção da autoridade anterior");
  expect(await read(page)).toEqual(replaced); expect(entries(replaced)).toHaveLength(0); await expect(page.locator(".storage-warning")).toHaveCount(0);
});

test("structurally invalid authority blocks event creation and explicit recovery preserves v1", async ({ page }) => {
  await setup(page);
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("dayforge-local"); request.onerror = () => reject(request.error);
    request.onsuccess = () => { const db = request.result, tx = db.transaction("plannerDocuments", "readwrite"), store = tx.objectStore("plannerDocuments"), bridge = store.get("execution/bridge");
      bridge.onsuccess = () => store.put({ ...bridge.result, sourceContentFingerprint: "0".repeat(64) }); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); };
  }));
  const corrupted = await read(page); await page.reload(); await expect(page.locator(".storage-warning")).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo evento", exact: true })).toBeDisabled(); expect(await read(page)).toEqual(corrupted);
  await page.goto("/configuracoes/dados-e-backup"); await expect(page.getByRole("button", { name: "Exportar arquivo", exact: true })).toBeDisabled();
  await page.locator('input[type="file"]').setInputFiles({ name: "fictional-v1.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state)) });
  await expect(page.getByRole("status")).toContainText("Backup importado com sucesso"); await page.goto("/planejamento/agenda");
  await expect(page.getByRole("button", { name: "Novo evento", exact: true })).toBeEnabled(); await expect(page.locator(".storage-warning")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(JSON.stringify(state));
});

test("calendar queries, keyboard cancel and responsive layout cause no writes", async ({ page }) => {
  await setup(page); await open(page); await submit(page); const before = await read(page);
  await page.getByRole("button", { name: "Próximo mês", exact: true }).click(); await page.getByRole("button", { name: "Mês anterior", exact: true }).click();
  await page.getByRole("button", { name: /^Consultar 2026-11-03:/ }).click(); await expect(page.getByRole("region", { name: "Eventos da data" })).toContainText("Evento fictício");
  await page.screenshot({ path: "outputs/agenda-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: "outputs/agenda-390.png", fullPage: true });
  await page.getByRole("button", { name: "Novo evento", exact: true }).focus(); await page.keyboard.press("Enter"); await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Título do evento", { exact: true })).toBeFocused(); await page.screenshot({ path: "outputs/agenda-dialog-390.png", fullPage: true });
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page.getByRole("button", { name: "Novo evento", exact: true })).toBeFocused();
  expect(await read(page)).toEqual(before);
});
