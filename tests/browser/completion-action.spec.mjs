import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.use({ timezoneId: "UTC" });
const date = "2026-10-06", instant = `${date}T08:30:00.000Z`;
const routine = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
const item = (title, start, end, completed = false) => ({ id: title, title, start, end, completed, notes: "", category: "estudo" });
const initial = () => ({ version: 1, routine: structuredClone(routine), monthlyGoals: {}, records: {
  [date]: { date, note: "", energy: 3, items: [item("Revisar", "07:00", "08:00"), item("Ativa", "08:00", "09:00"), item("Próxima", "09:00", "10:00"), item("Depois", "10:00", "11:00")] },
} });
async function open(page, state = initial(), now = instant) {
  await page.clock.setFixedTime(new Date(now));
  const raw = JSON.stringify(state);
  await page.addInitScript((value) => {
    if (!localStorage.getItem("rotina-369:data:v1")) localStorage.setItem("rotina-369:data:v1", value);
    window.__v1Writes = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "rotina-369:data:v1") window.__v1Writes++;
      return original.call(this, key, value);
    };
  }, raw);
  await page.goto("/hoje");
  await expect(page.getByRole("region", { name: "Resumo", exact: true })).toBeVisible();
  return raw;
}
function read(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const opening = indexedDB.open("dayforge-local");
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const db = opening.result, tx = db.transaction(["plannerDocuments", "metadata"], "readonly");
      const planner = tx.objectStore("plannerDocuments").get("planner/current"), bridge = tx.objectStore("plannerDocuments").get("execution/bridge"), metadata = tx.objectStore("metadata").get("database");
      tx.oncomplete = () => { db.close(); resolve({ planner: planner.result.payload, bridge: bridge.result.payload, metadata: metadata.result }); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  }));
}
async function fields(page, values = {}) {
  await page.getByLabel("Início real", { exact: true }).fill(values.start ?? `${date}T08:02`);
  await page.getByLabel("Fim real", { exact: true }).fill(values.end ?? `${date}T08:27`);
  await page.getByLabel("Fuso IANA da execução", { exact: true }).fill(values.timeZone ?? "UTC");
}
async function complete(page, title, values) {
  await page.getByRole("button", { name: `Concluir ${title}`, exact: true }).click();
  await fields(page, values);
  await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
const healthy = async (page) => {
  await expect(page.locator(".storage-warning")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Dados locais protegidos", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.__v1Writes)).toBe(0);
};

test("canonical completion serializes autosave, rejects double-submit and updates every Hoje section immediately and after reload", async ({ page }) => {
  const raw = await open(page); const before = await read(page);
  await page.getByText("Ver dia completo", { exact: true }).click();
  await page.locator(".daily-note textarea").fill("Nota anterior à conclusão");
  await page.getByRole("button", { name: "Concluir Ativa", exact: true }).focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Concluir Ativa", exact: true }); await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Início real", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Fim real", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Fuso IANA da execução", { exact: true })).toHaveValue("UTC");
  await fields(page, { start: `${date}T05:02`, end: `${date}T05:27`, timeZone: "America/Sao_Paulo" });
  await page.getByLabel("Observação da execução (opcional)").fill("Execução deliberada");
  await page.evaluate(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle); let held = false;
    crypto.subtle.digest = async (...args) => { if (!held) { held = true; await new Promise((resolve) => { window.__releaseCompletion = resolve; }); } return digest(...args); };
    const form = document.querySelector("dialog form"); form.requestSubmit(); form.requestSubmit();
  });
  await expect(dialog.getByRole("button", { name: "Processando…", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Concluir Ativa", exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => typeof window.__releaseCompletion)).toBe("function");
  await page.evaluate(() => window.__releaseCompletion());
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "O que importa agora", exact: true })).toBeFocused();
  await expect(page.getByRole("region", { name: "Agora" })).toContainText("Nenhuma atividade planejada");
  await expect(page.getByRole("region", { name: "Próximo" })).toContainText("Próxima");
  await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("1 concluídos");
  let saved = await read(page); const binding = saved.bridge.entries[1];
  expect(binding.execution).toEqual({ id: `execution:${binding.occurrenceId}`, timing: { kind: "timed", timeZone: "America/Sao_Paulo", interval: { start: `${date}T08:02:00.000Z`, end: `${date}T08:27:00.000Z` } }, recordedAt: instant, note: "Execução deliberada" });
  expect(saved.bridge.entries.filter((entry) => entry.execution)).toHaveLength(1);
  expect(saved.planner.records[date].items[1].actualMinutes).toBe(25);
  expect(saved.planner.records[date].note).toBe("Nota anterior à conclusão");
  expect(saved.planner.routine).toEqual(before.planner.routine); expect(binding.originalItem).toEqual(before.bridge.entries[1].originalItem);
  await expect(page.getByRole("button", { name: "Editar atividade", exact: true }).nth(1)).toBeDisabled();
  await expect(page.getByRole("button", { name: "Atividade concluída", exact: true })).toBeDisabled();
  await complete(page, "Próxima"); await expect(page.getByRole("region", { name: "Próximo" })).toContainText("Depois");
  await expect(page.getByRole("region", { name: "Depois" })).toContainText("Nada mais planejado");
  await complete(page, "Depois"); await expect(page.getByRole("region", { name: "Próximo" })).toContainText("Nenhuma próxima");
  await complete(page, "Revisar"); await expect(page.getByRole("region", { name: "Atenção" })).toContainText("Nenhuma decisão sinalizada");
  await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("4 concluídos · 0 futuros");
  await healthy(page); saved = await read(page);
  await page.reload(); await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("4 concluídos");
  expect(await read(page)).toEqual(saved); await healthy(page);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
});
test("virtual routine projections have no canonical completion action or allocated occurrence", async ({ page }) => {
  const state = initial(); state.records = {}; const { completed, ...virtual } = item("Virtual", "08:00", "09:00"); expect(completed).toBe(false); state.routine.ter = [virtual];
  await open(page, state); await expect(page.getByRole("region", { name: "Agora" })).toContainText("Virtual");
  await expect(page.getByRole("button", { name: /^Concluir / })).toHaveCount(0);
  expect((await read(page)).bridge.entries).toEqual([]); await healthy(page);
});
test("historical legacy completion remains without execution and without Concluir or undo", async ({ page }) => {
  const state = initial(); state.records[date].items = [item("Histórica", "08:00", "09:00", true)];
  await open(page, state); await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("1 concluídos");
  await expect(page.getByRole("button", { name: /^Concluir / })).toHaveCount(0);
  expect((await read(page)).bridge.entries[0].execution).toBeNull();
  await page.getByText("Ver dia completo", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Atividade concluída", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Marcar como (concluída|pendente)/ })).toHaveCount(0);
  await page.reload(); expect((await read(page)).bridge.entries[0].execution).toBeNull(); await healthy(page);
});
test("invalid real interval keeps dialog and original state; corrected explicit inputs can complete", async ({ page }) => {
  await open(page); const before = await read(page);
  await page.getByRole("button", { name: "Concluir Ativa", exact: true }).click();
  await fields(page, { end: `${date}T08:00` });
  await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("O fim real deve ser posterior");
  expect(await read(page)).toEqual(before); await healthy(page);
  await fields(page); await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0); await healthy(page);
});
test("aborted persistence rolls back without storageBlocked; unchanged retry reuses recordedAt and stores one fact", async ({ page }) => {
  await open(page); const before = await read(page);
  await page.getByRole("button", { name: "Concluir Ativa", exact: true }).click(); await fields(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put; let fail = true;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (fail && args[0]?.id === "execution/bridge") { fail = false; this.transaction.abort(); }
      return request;
    };
  });
  await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("tente novamente");
  await expect(page.getByLabel("Início real", { exact: true })).toHaveValue(`${date}T08:02`);
  expect(await read(page)).toEqual(before); await healthy(page);
  await page.clock.setFixedTime(new Date(`${date}T09:00:00.000Z`));
  await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const after = await read(page); expect(after.bridge.entries[1].execution.recordedAt).toBe(instant);
  expect(after.bridge.entries.filter((entry) => entry.execution)).toHaveLength(1); await healthy(page);
});
test("UI completion is exported, restored and reloaded as an identical fact without version changes", async ({ page }) => {
  await open(page); await complete(page, "Ativa"); const saved = await read(page);
  await page.goto("/configuracoes/dados-e-backup");
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Exportar arquivo", exact: true }).click();
  const raw = await readFile(await (await download).path(), "utf8"), backup = JSON.parse(raw);
  expect(backup.formatVersion).toBe(2); expect(backup.exportedFrom.persistenceGeneration).toBe(2); expect(saved.metadata.schemaVersion).toBe(1);
  expect(backup.payload.executionBridge.bridge).toEqual(saved.bridge);
  await page.goto("/hoje"); await complete(page, "Próxima");
  await page.goto("/configuracoes/dados-e-backup");
  await expect(page.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({ name: "completion-fictional.json", mimeType: "application/json", buffer: Buffer.from(raw) });
  await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");
  await page.goto("/hoje"); await page.reload();
  await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("1 concluídos");
  saved.metadata.authorityEpoch += 1;
  expect(await read(page)).toEqual(saved); await healthy(page);
});
test("completion dialog supports keyboard cancel, predictable focus and compact layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  const button = page.getByRole("button", { name: "Concluir Ativa", exact: true }); await button.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Concluir Ativa", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0); await expect(button).toBeFocused();
  await button.click(); await page.getByRole("button", { name: "Cancelar", exact: true }).click(); await expect(button).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await healthy(page);
});
test("overnight completion after day rollover modifies the correct prior-day binding", async ({ page }) => {
  const state = initial(); state.records[date].items = [item("Noturna", "23:30", "01:00"), item("Continuação", "01:00", "02:00")];
  await open(page, state, "2026-10-07T00:10:00.000Z");
  await expect(page.getByRole("region", { name: "Agora" })).toContainText("Noturna");
  await complete(page, "Noturna", { start: `${date}T23:50`, end: "2026-10-07T00:05" });
  await expect(page.getByRole("region", { name: "Agora" })).toContainText("Nenhuma atividade planejada");
  await expect(page.getByRole("region", { name: "Próximo" })).toContainText("Continuação");
  const saved = await read(page); expect(saved.bridge.entries[0].sourceDate).toBe(date);
  expect(saved.planner.records[date].items[0].actualMinutes).toBe(15); expect(saved.planner.records["2026-10-07"]).toBeUndefined();
  await page.reload(); await expect(page.getByRole("region", { name: "Agora" })).toContainText("Nenhuma atividade planejada"); await healthy(page);
});
