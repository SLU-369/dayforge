import { expect, test } from "@playwright/test";

test.use({ timezoneId: "UTC" });

function readAuditState(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("dayforge-local");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction("plannerDocuments", "readonly");
      const planner = tx.objectStore("plannerDocuments").get("planner/current");
      const bridge = tx.objectStore("plannerDocuments").get("execution/bridge");
      tx.oncomplete = () => { database.close(); resolve({ planner: planner.result.payload, bridge: bridge.result.payload }); };
      tx.onerror = () => { database.close(); reject(tx.error); };
    };
  }));
}

for (const completed of [false, true]) {
  test(`legacy completion control is disabled without blocking storage (${completed ? "historical" : "planned"})`, async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-06T08:30:00.000Z") });
    const raw = JSON.stringify({ version: 1,
      routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
      records: { "2026-10-06": { date: "2026-10-06", note: "", energy: 3,
        items: [{ id: "audit", title: "Atividade fictícia", start: "08:00", end: "09:00", notes: "", category: "estudo", completed }] } }, monthlyGoals: {} });
    await page.addInitScript((value) => {
      if (!localStorage.getItem("rotina-369:data:v1")) localStorage.setItem("rotina-369:data:v1", value);
    }, raw);
    await page.goto("/hoje");
    await expect(page.getByRole("region", { name: "Resumo" })).toContainText(`${completed ? 1 : 0} concluídos`);
    await page.getByText("Ver dia completo", { exact: true }).click();
    const control = page.getByRole("button", { name: completed ? "Atividade concluída" : "Atividade pendente", exact: true });
    await expect(control).toBeDisabled();
    await expect(page.getByRole("button", { name: /Marcar como (concluída|pendente)/ })).toHaveCount(0);
    await expect(page.getByText("Alteração de conclusão indisponível nesta etapa.")).toBeVisible();
    const before = await readAuditState(page);
    await control.evaluate((button) => button.click());
    expect(await readAuditState(page)).toEqual(before);

    await page.getByRole("button", { name: "Editar atividade", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.getByLabel("Minutos realizados (opcional)").fill("45");
    await page.getByRole("button", { name: "Salvar atividade", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await readAuditState(page)).planner.records["2026-10-06"].items[0].actualMinutes).toBe(45);
    const saved = await readAuditState(page);
    expect(saved.planner.records["2026-10-06"].items[0].completed).toBe(completed);
    expect(saved.bridge.entries[0].execution).toBeNull();
    await expect(page.locator(".storage-warning")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Dados locais protegidos" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("region", { name: "Resumo" })).toContainText(`${completed ? 1 : 0} concluídos`);
    expect(await readAuditState(page)).toEqual(saved);
    expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
    await expect(page.getByRole("button", { name: "Concluir", exact: true })).toHaveCount(0);
  });
}
