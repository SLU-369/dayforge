import { expect, test } from "@playwright/test";

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
