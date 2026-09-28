import { expect, test } from "@playwright/test";

const emptyRoutine = {
  seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [],
};

function validPayload() {
  return { version: 1, routine: emptyRoutine, records: {}, monthlyGoals: {} };
}

async function readActivePlanner(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const opening = indexedDB.open("dayforge-local");
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const database = opening.result;
      const transaction = database.transaction("plannerDocuments", "readonly");
      const reading = transaction.objectStore("plannerDocuments").get("planner/current");
      reading.onerror = () => reject(reading.error);
      reading.onsuccess = () => { resolve(reading.result?.payload ?? null); database.close(); };
    };
  }));
}

test("payload v1 inválido permanece intacto durante a sessão temporária", async ({ page }) => {
  const raw = "{conteudo-corrompido";
  await page.addInitScript((value) => localStorage.setItem("rotina-369:data:v1", value), raw);
  await page.goto("/hoje");

  await expect(page.locator(".storage-warning")).toContainText("dados locais foram preservados");
  await expect(page.locator(".storage-warning")).toContainText("não serão salvas");
  await page.getByRole("button", { name: "Energia 4" }).click();
  await page.waitForTimeout(200);

  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
});

test("payload estruturalmente inválido permanece protegido após reload", async ({ page }) => {
  const raw = JSON.stringify({ version: 1, routine: [], records: [] });
  await page.addInitScript((value) => localStorage.setItem("rotina-369:data:v1", value), raw);
  await page.goto("/hoje");

  await expect(page.locator(".storage-warning")).toContainText("dados locais foram preservados");
  await page.getByRole("button", { name: "Energia 4" }).click();
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);

  await page.reload();
  await expect(page.locator(".storage-warning")).toContainText("dados locais foram preservados");
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
});

test("backup v1 válido recupera armazenamento e ativa autosave v2", async ({ page }) => {
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
  await expect.poll(async () => Object.values((await readActivePlanner(page)).records)[0]?.energy).toBe(4);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
  expect(await page.evaluate(() => localStorage.getItem("dayforge:persistence:v2"))).toBe("active");
});

test("primeiro uso exporta backup v2 e preserva v1 após edição", async ({ page }) => {
  const raw = JSON.stringify(validPayload());
  await page.addInitScript((value) => localStorage.setItem("rotina-369:data:v1", value), raw);
  await page.goto("/hoje");
  await expect(page.getByRole("button", { name: "Energia 4" })).toBeVisible();
  await expect.poll(async () => (await readActivePlanner(page))?.version).toBe(1);
  await page.getByRole("button", { name: "Energia 4" }).click();
  await expect.poll(async () => Object.values((await readActivePlanner(page)).records)[0]?.energy).toBe(4);
  await page.goto("/configuracoes/dados-e-backup");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar arquivo" }).click();
  const backup = JSON.parse(await (await download).path().then(async (path) => {
    const { readFile } = await import("node:fs/promises");
    return readFile(path, "utf8");
  }));
  expect(backup.formatVersion).toBe(2);
  expect(backup.exportedFrom.persistenceGeneration).toBe(2);
  expect(Object.values(backup.payload.planner.records)[0].energy).toBe(4);
  expect(await page.evaluate(() => localStorage.getItem("rotina-369:data:v1"))).toBe(raw);
});

test("dados e backup carrega diretamente no layout compacto", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/configuracoes/dados-e-backup");
  await expect(page.getByRole("heading", { name: "Dados e backup" })).toBeVisible();
  await expect(page.getByText("Armazenamento local ativo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar arquivo" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
