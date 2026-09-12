import { expect, test } from "@playwright/test";

const emptyRoutine = {
  seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [],
};

function validPayload() {
  return { version: 1, routine: emptyRoutine, records: {}, monthlyGoals: {} };
}

test("payload v1 inválido permanece intacto durante a sessão temporária", async ({ page }) => {
  const raw = "{conteudo-corrompido";
  await page.addInitScript((value) => localStorage.setItem("rotina-369:data:v1", value), raw);
  await page.goto("/hoje");

  await expect(page.getByRole("alert")).toContainText("Dados locais protegidos");
  await expect(page.getByRole("alert")).toContainText("não será sobrescrito");
  await page.getByRole("button", { name: "Energia 4" }).click();
  await page.waitForTimeout(200);

  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
});

test("payload estruturalmente inválido permanece protegido após reload", async ({ page }) => {
  const raw = JSON.stringify({ version: 1, routine: [], records: [] });
  await page.addInitScript((value) => localStorage.setItem("rotina-369:data:v1", value), raw);
  await page.goto("/hoje");

  await expect(page.getByRole("alert")).toContainText("Dados locais protegidos");
  await page.getByRole("button", { name: "Energia 4" }).click();
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);

  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Dados locais protegidos");
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
});

test("backup válido recupera armazenamento e reativa autosave", async ({ page }) => {
  const raw = JSON.stringify({ version: 1, routine: [], records: [] });
  await page.addInitScript((value) => {
    if (sessionStorage.getItem("stage-0-2-seeded")) return;
    localStorage.setItem("rotina-369:data:v1", value);
    sessionStorage.setItem("stage-0-2-seeded", "true");
  }, raw);
  await page.goto("/configuracoes/dados-e-backup");

  const main = page.getByRole("main");
  await expect(main.getByText("Dados locais protegidos", { exact: true })).toBeVisible();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({
    name: "backup-invalido.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ version: 1, routine: [], records: [] })),
  });
  await expect(page.getByRole("status")).toContainText("não é um backup válido");
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
  await expect(main.getByText("Dados locais protegidos", { exact: true })).toBeVisible();

  await input.setInputFiles({
    name: "backup-valido.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(validPayload())),
  });
  await expect(main.getByText("Armazenamento local ativo", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");

  await page.goto("/hoje");
  await page.getByRole("button", { name: "Energia 4" }).click();
  await expect.poll(() => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("rotina-369:data:v1"));
    return Object.values(state.records)[0]?.energy;
  })).toBe(4);
});

test("taxonomia da Etapa 0.2 funciona no layout compacto", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/formacao/cursos-rapidos");

  await expect(page.getByRole("heading", { name: "Aprendizados curtos, com propósito" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await expect(page.getByRole("link", { name: /Cursos rápidos/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Rotina/ })).toBeVisible();
  await expect(page.getByText("Rotina-base", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
