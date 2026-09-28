import { expect, test } from "@playwright/test";

test.use({ timezoneId: "America/Sao_Paulo" });

const emptyRoutine = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
const entry = (id, start, end) => ({ id, start, end, title: id, notes: "", category: "estudo", completed: false });

test("Hoje contextual lê o planner v2 sem gravar o contexto derivado", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-28T12:30:00.000Z") });
  const payload = JSON.stringify({
    version: 1,
    routine: emptyRoutine,
    records: {
      "2026-09-28": {
        date: "2026-09-28",
        items: [entry("Revisar", "08:00", "09:00"), entry("Ativa", "09:00", "10:00"), entry("Próxima", "10:00", "11:00"), entry("Mais tarde", "11:00", "12:00")],
        note: "", energy: 3,
      },
    },
    monthlyGoals: {},
  });
  await page.addInitScript((raw) => localStorage.setItem("rotina-369:data:v1", raw), payload);
  await page.goto("/hoje");

  await expect(page.getByRole("heading", { name: "O que importa agora" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Agora" }).getByText("Ativa")).toBeVisible();
  await expect(page.getByRole("region", { name: "Próximo" }).getByText("Próxima")).toBeVisible();
  await expect(page.getByRole("region", { name: "Depois" }).getByText("Mais tarde")).toBeVisible();
  await expect(page.getByRole("region", { name: "Atenção" }).getByText("Revisar")).toBeVisible();
  await expect(page.getByRole("region", { name: "Atenção" })).toContainText("Aguardando decisão");
  await expect(page.getByRole("region", { name: "Resumo" })).toContainText("4 itens no dia");
  await expect(page.getByText("Ver dia completo")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(payload);

  await page.evaluate(() => {
    window.__todayWrites = 0;
    for (const method of ["put", "add", "delete"]) {
      const original = IDBObjectStore.prototype[method];
      IDBObjectStore.prototype[method] = function (...args) {
        window.__todayWrites += 1;
        return original.apply(this, args);
      };
    }
  });
  await page.getByRole("button", { name: "Próximo dia" }).click();
  await expect(page.getByRole("region", { name: "Resumo" })).toContainText("0 itens no dia");
  await page.getByRole("button", { name: "Dia anterior" }).click();
  await expect(page.getByRole("region", { name: "Agora" }).getByText("Ativa")).toBeVisible();
  expect(await page.evaluate(() => window.__todayWrites)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(payload);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("region", { name: "Agora" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Resumo" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("horário legado não interpretável mostra erro sem perder o planner", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-28T12:30:00.000Z") });
  const payload = JSON.stringify({
    version: 1, routine: emptyRoutine, monthlyGoals: {},
    records: { "2026-09-28": { date: "2026-09-28", items: [entry("Inválido", "25:00", "10:00")], note: "", energy: 3 } },
  });
  await page.addInitScript((raw) => localStorage.setItem("rotina-369:data:v1", raw), payload);
  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Dados locais protegidos" })).toBeVisible();
  await expect(page.getByText("Não foi possível interpretar os horários deste dia.", { exact: false })).toBeVisible();
  await expect(page.getByText("Ver dia completo")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(payload);
});
