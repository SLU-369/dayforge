import { expect, test } from "@playwright/test";

test.use({ timezoneId: "UTC" });

test("duplicate daily identities persist across reload and complete independently in Hoje order", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-06T08:30:00.000Z") });
  const item = { id: "same", title: "Fictício", start: "08:00", end: "09:00", notes: "", category: "estudo", completed: false };
  const raw = JSON.stringify({ version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
    records: { "2026-10-06": { date: "2026-10-06", items: [item, item], note: "", energy: 3 } }, monthlyGoals: {} });
  await page.addInitScript((value) => {
    if (!localStorage.getItem("rotina-369:data:v1")) localStorage.setItem("rotina-369:data:v1", value);
    const original = Storage.prototype.setItem;
    window.__v1Writes = 0;
    Storage.prototype.setItem = function (key, value) {
      if (key === "rotina-369:data:v1") window.__v1Writes++;
      return original.call(this, key, value);
    };
  }, raw);
  await page.goto("/hoje");
  await expect(page.getByRole("region", { name: "Resumo" })).toContainText("2 itens no dia");
  const read = () => page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("dayforge-local");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction(["plannerDocuments", "metadata"], "readonly");
      const doc = tx.objectStore("plannerDocuments").get("execution/bridge");
      const meta = tx.objectStore("metadata").get("database");
      tx.oncomplete = () => { database.close(); resolve({ document: doc.result, metadata: meta.result }); };
      tx.onerror = () => { database.close(); reject(tx.error); };
    };
  }));
  await expect.poll(async () => (await read()).document?.payload.entries.length).toBe(2);
  const before = await read();
  expect(new Set(before.document.payload.entries.map((entry) => entry.occurrenceId)).size).toBe(2);
  expect(before.metadata.executionBridgeVersion).toBe(2);
  expect(before.metadata.authorityEpoch).toBe(0);
  expect(before.document.payload.version).toBe(2);
  expect(before.document.payload.entries.every((entry) => !Object.hasOwn(entry, "planningAudit"))).toBe(true);
  expect(before.metadata.schemaVersion).toBe(1);
  await page.reload();
  await expect(page.getByRole("region", { name: "Resumo" })).toContainText("2 itens no dia");
  expect(await read()).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
  expect(await page.evaluate(() => window.__v1Writes)).toBe(0);
  // 2A exposes one Agora at a time; completing it reveals the other active duplicate.
  const action = page.getByRole("button", { name: "Concluir Fictício", exact: true });
  await expect(action).toHaveCount(1);
  for (const index of [0, 1]) {
    await action.click();
    await page.getByLabel("Início real", { exact: true }).fill("2026-10-06T08:00");
    await page.getByLabel("Fim real", { exact: true }).fill("2026-10-06T08:20");
    await page.getByRole("button", { name: "Confirmar conclusão", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const current = await read();
    expect(current.document.payload.entries[index].execution.id).toBe(`execution:${before.document.payload.entries[index].occurrenceId}`);
    expect(current.document.payload.entries.map((entry) => entry.originalItem)).toEqual(before.document.payload.entries.map((entry) => entry.originalItem));
    if (index === 0) { expect(current.document.payload.entries[1].execution).toBeNull(); await expect(action).toHaveCount(1); }
  }
  await expect(action).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Resumo", exact: true })).toContainText("2 concluídos");
  await expect(page.locator(".storage-warning")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
  expect(await page.evaluate(() => window.__v1Writes)).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("region", { name: "Agora" })).toBeVisible();
});
