import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.use({ timezoneId: "UTC" });
const date = "2026-10-10", now = `${date}T12:00:00.000Z`;
const item = (title, start = "06:30", end = "07:30") => ({ id: title, title, start, end, completed: false, notes: "", category: "saude" });
const state = () => ({ version: 1, monthlyGoals: {}, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] }, records: {
  [date]: { date, note: "", energy: 3, items: [item("Treino fictício"), item("Outra", "15:00", "16:00")] },
} });
async function open(page, initial = state()) {
  await page.clock.setFixedTime(new Date(now));
  await page.addInitScript((raw) => { if (!localStorage.getItem("rotina-369:data:v1")) localStorage.setItem("rotina-369:data:v1", raw); }, JSON.stringify(initial));
  await page.goto("/hoje"); await expect(page.getByRole("region", { name: "Resumo", exact: true })).toBeVisible();
}
async function read(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("dayforge-local"); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction(["plannerDocuments", "metadata"], "readonly");
      const planner = tx.objectStore("plannerDocuments").get("planner/current"), bridge = tx.objectStore("plannerDocuments").get("execution/bridge"), metadata = tx.objectStore("metadata").get("database");
      tx.oncomplete = () => { db.close(); resolve({ planner: planner.result.payload, bridge: bridge.result.payload, metadata: metadata.result }); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  }));
}
async function dialog(page, start = `${date}T20:00`, end = `${date}T21:00`, title = "Treino fictício") {
  await page.getByRole("button", { name: `Reagendar ${title}`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `Reagendar ${title}`, exact: true }); await expect(dialog).toBeVisible();
  if (await dialog.getByLabel("Confirmo este planejamento anterior", { exact: true }).count()) await dialog.getByLabel("Confirmo este planejamento anterior", { exact: true }).check();
  await dialog.getByLabel("Novo início", { exact: true }).fill(start); await dialog.getByLabel("Novo fim", { exact: true }).fill(end);
  return dialog;
}
async function submit(page) { await page.getByRole("button", { name: "Confirmar reagendamento", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0); }
async function healthy(page) { await expect(page.locator(".storage-warning")).toHaveCount(0); await expect(page.getByRole("heading", { name: "Dados locais protegidos", exact: true })).toHaveCount(0); }

test("06:30 → 20:00 is explicit, updates Hoje/full day, protects legacy controls, then completes with audited history", async ({ page }) => {
  await open(page); const before = await read(page);
  await page.getByText("Ver dia completo", { exact: true }).click(); await page.locator(".daily-note textarea").fill("Nota permitida");
  const modal = await dialog(page);
  await expect(modal.getByLabel("Anterior início", { exact: true })).toHaveValue(`${date}T06:30`);
  await expect(modal.getByLabel("Anterior fim", { exact: true })).toHaveValue(`${date}T07:30`);
  await expect(modal.getByLabel("Anterior fuso IANA", { exact: true })).toHaveValue("UTC");
  await modal.getByLabel("Motivo (opcional)").fill("Decisão fictícia"); await submit(page);
  await expect(page.getByRole("region", { name: "Atenção" })).not.toContainText("Treino fictício");
  await expect(page.getByRole("region", { name: "Próximo" })).toContainText("Outra");
  await expect(page.getByRole("region", { name: "Depois" })).toContainText("20:00–21:00");
  await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("2 itens no dia · 0 concluídos · 2 futuros");
  await expect(page.locator(".timeline-list")).toContainText("20:00"); await expect(page.locator(".timeline-list .time-column").first()).not.toContainText("06:30");
  const auditedRow = page.locator(".timeline-item").filter({ has: page.getByRole("heading", { name: "Treino fictício", exact: true }) });
  await expect(auditedRow.getByRole("button", { name: "Editar atividade", exact: true })).toBeDisabled();
  await expect(auditedRow.getByRole("button", { name: "Excluir atividade", exact: true })).toBeDisabled();
  await expect(auditedRow.getByRole("button", { name: "Atividade pendente", exact: true })).toBeDisabled();
  await expect(page.locator(".timeline-list .time-column").first()).toContainText("15:00");
  await page.screenshot({ path: "outputs/rescheduling-desktop.png", fullPage: true });
  const after = await read(page), binding = after.bridge.entries[0];
  expect(binding.occurrenceId).toBe(before.bridge.entries[0].occurrenceId); expect(binding.originalItem).toEqual(before.bridge.entries[0].originalItem);
  expect(binding.execution).toBeNull(); expect(after.planner.records[date].items).toEqual(before.planner.records[date].items); expect(after.planner.records[date].note).toBe("Nota permitida");
  await page.getByRole("region", { name: "Depois" }).getByText("Histórico de Treino fictício", { exact: true }).click();
  await expect(page.getByRole("region", { name: "Depois" })).toContainText("Motivo: Decisão fictícia");
  await page.clock.setFixedTime(new Date(`${date}T20:30:00.000Z`)); await page.reload();
  await expect(page.getByRole("region", { name: "Agora" })).toContainText("Treino fictício");
  await page.getByRole("button", { name: "Concluir Treino fictício", exact: true }).click();
  await expect(page.getByLabel("Início real", { exact: true })).toHaveValue("");
  await page.getByLabel("Início real", { exact: true }).fill(`${date}T20:05`); await page.getByLabel("Fim real", { exact: true }).fill(`${date}T20:25`);
  await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
  const done = await read(page); expect(done.bridge.entries[0].planningAudit).toEqual(binding.planningAudit); expect(done.planner.records[date].items[0].actualMinutes).toBe(20);
  await page.getByRole("region", { name: "Histórico concluído" }).getByText("Histórico de Treino fictício", { exact: true }).click();
  await expect(page.getByRole("region", { name: "Histórico concluído" })).toContainText("Concluída após reagendamento");
  await expect(page.getByRole("region", { name: "Histórico concluído" }).locator('[data-derived-status]')).toHaveAttribute("data-derived-status", "completed_rescheduled");
  await expect(page.getByRole("region", { name: "Histórico concluído" })).toContainText("Execução real:");
  await page.reload(); expect(await read(page)).toEqual(done); await healthy(page);
});

test("other day keeps selected date, offers destination, appends subsequent events and survives backup/restore", async ({ page }) => {
  await open(page); await dialog(page, "2027-01-02T23:00", "2027-01-03T01:00"); await submit(page);
  await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("1 itens no dia");
  await expect(page.getByRole("button", { name: "Ver dia reagendado", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver dia reagendado", exact: true }).click();
  await expect(page.getByRole("region", { name: "Próximo" })).toContainText("Treino fictício");
  const modal = await dialog(page, "2027-01-02T20:00", "2027-01-02T21:30");
  await expect(modal.getByLabel("Confirmo este planejamento anterior", { exact: true })).toHaveCount(0); await expect(modal).toContainText("Planejamento vigente:");
  await expect(modal).toContainText("90 min"); await submit(page);
  const saved = await read(page); expect(saved.bridge.entries[0].planningAudit.rescheduleHistory).toHaveLength(2);
  await page.goto("/configuracoes/dados-e-backup"); const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Exportar arquivo", exact: true }).click();
  const raw = await readFile(await (await download).path(), "utf8"), backup = JSON.parse(raw);
  expect(backup.formatVersion).toBe(2); expect(backup.exportedFrom).toEqual({ persistenceGeneration: 2, schemaVersion: 1 }); expect(backup.payload.executionBridge.bridge).toEqual(saved.bridge);
  await expect(page.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({ name: "fictional-rescheduling.json", mimeType: "application/json", buffer: Buffer.from(raw) });
  await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");
  await page.goto("/hoje?date=2027-01-02"); await page.reload(); await expect(page.getByRole("region", { name: "Próximo" })).toContainText("20:00–21:30");
  expect((await read(page)).bridge).toEqual(saved.bridge); await healthy(page);
});

test("rollback + unchanged retry preserve inputs and decision timestamp; double-submit and Escape during commit cannot duplicate or close", async ({ page }) => {
  await open(page); const before = await read(page), modal = await dialog(page);
  await page.evaluate(() => { const put = IDBObjectStore.prototype.put; let fail = true; IDBObjectStore.prototype.put = function (...args) { const request = put.apply(this, args); if (fail && args[0]?.id === "execution/bridge") { fail = false; this.transaction.abort(); } return request; }; });
  await modal.getByRole("button", { name: "Confirmar reagendamento", exact: true }).click();
  await expect(modal.getByRole("alert")).toContainText("tente novamente"); await expect(modal.getByLabel("Novo início", { exact: true })).toHaveValue(`${date}T20:00`);
  expect(await read(page)).toEqual(before); await healthy(page);
  await page.clock.setFixedTime(new Date(`${date}T13:00:00.000Z`));
  await page.evaluate(() => { const digest = crypto.subtle.digest.bind(crypto.subtle); let held = false; crypto.subtle.digest = async (...args) => { if (!held) { held = true; await new Promise((resolve) => { window.__releaseRescheduling = resolve; }); } return digest(...args); }; const form = document.querySelector("dialog form"); form.requestSubmit(); form.requestSubmit(); });
  await expect(modal.getByRole("button", { name: "Processando…", exact: true })).toBeDisabled(); await expect(modal.getByLabel("Novo início", { exact: true })).toBeDisabled();
  await page.keyboard.press("Escape"); await expect(modal).toBeVisible();
  await expect.poll(() => page.evaluate(() => typeof window.__releaseRescheduling)).toBe("function"); await page.evaluate(() => window.__releaseRescheduling());
  await expect(modal).toHaveCount(0); const events = (await read(page)).bridge.entries[0].planningAudit.rescheduleHistory; expect(events).toHaveLength(1); expect(events[0].changedAt).toBe(now);
});

test("first baseline requires confirmation; no-op and past destination keep dialog; keyboard/Escape/Cancel restore focus at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  const trigger = page.getByRole("button", { name: "Reagendar Treino fictício", exact: true }); await trigger.focus(); await page.keyboard.press("Enter");
  const modal = page.getByRole("dialog"); await expect(modal.getByLabel("Anterior início", { exact: true })).toBeFocused();
  await modal.screenshot({ path: "outputs/rescheduling-dialog-top-390.png" });
  // Edge traverses the native date/time segments before leaving datetime-local.
  for (let step = 0; step < 10 && !await modal.getByLabel("Anterior fim", { exact: true }).evaluate((element) => element === document.activeElement); step++) {
    await page.keyboard.press("Tab"); expect(await modal.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await expect(modal.getByLabel("Anterior fim", { exact: true })).toBeFocused();
  await modal.getByRole("button", { name: "Confirmar reagendamento", exact: true }).click(); await expect(modal.getByRole("alert")).toContainText("Confirme explicitamente");
  await modal.getByLabel("Confirmo este planejamento anterior", { exact: true }).check();
  await modal.getByRole("button", { name: "Confirmar reagendamento", exact: true }).click(); await expect(modal.getByRole("alert")).toContainText("passado");
  await modal.getByLabel("Novo início", { exact: true }).fill(`${date}T20:00`); await modal.getByLabel("Novo fim", { exact: true }).fill(`${date}T21:00`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: "outputs/rescheduling-390.png", fullPage: true });
  await page.keyboard.press("Escape"); await expect(modal).toHaveCount(0); await expect(trigger).toBeFocused();
  await trigger.click(); await page.getByRole("button", { name: "Cancelar", exact: true }).click(); await expect(trigger).toBeFocused();
  expect((await read(page)).bridge.entries[0].planningAudit).toBeUndefined();
  await dialog(page); await page.getByLabel("Novo fuso IANA", { exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page.getByRole("heading", { name: "O que importa agora", exact: true })).toBeFocused();
  await page.getByText("Ver dia completo", { exact: true }).click();
  const row = page.locator(".timeline-item").filter({ has: page.getByRole("heading", { name: "Treino fictício", exact: true }) });
  const checkbox = await row.locator(".check-button").boundingBox(), time = await row.locator(".time-column").boundingBox(), body = await row.locator(".item-body").boundingBox();
  expect(time.x).toBeGreaterThan(checkbox.x + checkbox.width); expect(body.x).toBeGreaterThan(time.x); expect(body.width).toBeGreaterThan(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await row.screenshot({ path: "outputs/rescheduling-timeline-390.png" });
});

test("monthly compatibility counts rescheduled planning at destination and full-day metrics omit the old interval", async ({ page }) => {
  await open(page); await dialog(page, "2026-10-11T20:00", "2026-10-11T21:30"); await submit(page);
  await page.getByText("Ver dia completo", { exact: true }).click();
  await expect(page.getByRole("region", { name: "Resumo do dia", exact: true })).toContainText("0 de 1 atividades");
  await expect(page.locator(".timeline-list")).not.toContainText("Treino fictício");
  await page.goto("/planejamento/agenda"); await expect(page.getByRole("heading", { name: "Seu ritmo ao longo do mês", exact: true })).toBeVisible();
  await expect(page.locator(".metric-card").filter({ hasText: "Atividades" })).toContainText("de 1 planejadas");
  await page.goto("/hoje?date=2026-10-11"); await expect(page.getByRole("region", { name: "Próximo" })).toContainText("20:00–21:30");
  await page.getByText("Ver dia completo", { exact: true }).click(); await expect(page.locator(".timeline-list")).toContainText("90 min planejados");
  await healthy(page);
});

test("virtual projections and ambiguous duplicate legacy IDs have no Reagendar and are never materialized", async ({ page }) => {
  const initial = state(); initial.records = {}; const virtual = item("Virtual"); delete virtual.completed; initial.routine.sab = [virtual];
  await open(page, initial); await expect(page.getByRole("button", { name: /^Reagendar / })).toHaveCount(0); expect((await read(page)).bridge.entries).toEqual([]);
});

test("ambiguous legacy IDs and historical completion have no Reagendar", async ({ page }) => {
  const initial = state(); initial.records[date].items = [item("Duplicate"), item("Duplicate"), { ...item("Histórica"), completed: true }];
  await open(page, initial); await expect(page.getByRole("button", { name: /^Reagendar / })).toHaveCount(0);
  expect((await read(page)).bridge.entries).toHaveLength(3); await healthy(page);
});

test("stale React autosave after external restore refreshes authority without overwriting the replacement", async ({ page, context }) => {
  await open(page); const other = await context.newPage(); await other.clock.setFixedTime(new Date(now)); await other.goto("/configuracoes/dados-e-backup");
  await expect(other.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeEnabled();
  const replacement = state(); replacement.records[date].note = "Replacement note";
  await other.locator('input[type="file"]').setInputFiles({ name: "fictional-replacement.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(replacement)) });
  await expect(other.getByRole("status")).toContainText("Backup importado com sucesso");
  await page.getByText("Ver dia completo", { exact: true }).click(); await page.locator(".daily-note textarea").fill("Obsolete note");
  await expect(page.locator(".daily-note textarea")).toHaveValue("Replacement note"); expect((await read(page)).planner.records[date].note).toBe("Replacement note");
  await healthy(page); await other.close();
});

for (const action of ["restore", "reschedule", "completion"]) test(`two pages detect stale dialog after ${action} without touching the new snapshot`, async ({ page, context }) => {
  await open(page); await dialog(page);
  const other = await context.newPage(); await other.clock.setFixedTime(new Date(now)); await other.goto("/hoje"); await expect(other.getByRole("region", { name: "Resumo", exact: true })).toBeVisible();
  if (action === "restore") {
    await other.goto("/configuracoes/dados-e-backup"); await expect(other.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeEnabled();
    await other.locator('input[type="file"]').setInputFiles({ name: "fictional-replacement.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state())) });
    await expect(other.getByRole("status")).toContainText("Backup importado com sucesso");
  } else if (action === "reschedule") { await dialog(other, `${date}T22:00`, `${date}T23:00`); await submit(other); }
  else {
    await other.getByRole("button", { name: "Concluir Treino fictício", exact: true }).click(); await other.getByLabel("Início real", { exact: true }).fill(`${date}T06:35`); await other.getByLabel("Fim real", { exact: true }).fill(`${date}T07:25`);
    await other.getByRole("button", { name: "Confirmar conclusão", exact: true }).click(); await expect(other.getByRole("dialog")).toHaveCount(0);
  }
  const saved = await read(other); await page.getByRole("button", { name: "Confirmar reagendamento", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(action === "restore" ? "substituídos" : "planejamento mudou");
  expect(await read(page)).toEqual(saved); await healthy(page); await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  if (action === "reschedule") await expect(page.getByRole("region", { name: "Depois" })).toContainText("22:00–23:00");
  await other.close();
});

test("an already-open Concluir detects planning changed by a second page", async ({ page, context }) => {
  await open(page); await page.getByRole("button", { name: "Concluir Treino fictício", exact: true }).click();
  await page.getByLabel("Início real", { exact: true }).fill(`${date}T06:35`); await page.getByLabel("Fim real", { exact: true }).fill(`${date}T07:25`);
  const other = await context.newPage(); await other.clock.setFixedTime(new Date(now)); await other.goto("/hoje"); await expect(other.getByRole("region", { name: "Resumo", exact: true })).toBeVisible();
  await dialog(other); await submit(other); const saved = await read(other);
  await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click(); await expect(page.getByRole("dialog").getByRole("alert")).toContainText("planejamento mudou");
  expect(await read(page)).toEqual(saved); await healthy(page); await other.close();
});
