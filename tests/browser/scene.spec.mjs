import { test, expect } from '@playwright/test';

const route = '/configuracoes/aparencia?scene=3d';
test.use({ video: 'on' });

async function openLandscape(page) {
  await page.addInitScript(() => {
    localStorage.setItem('dayforge:appearance:v1', JSON.stringify({ version: 1, mode: 'manual', manualTheme: 'day', cityId: null, ambientMotion: true }));
    localStorage.setItem('dayforge:theme:v1', 'day');
  });
  await page.goto(route);
  await expect(page.getByRole('button', { name: /^Dia Luz/ })).toBeEnabled();
  await expect(page.locator('[data-landscape-status]')).toHaveAttribute('data-landscape-status', 'ready');
}

for (const [width, height] of [[1440, 900], [1024, 768], [390, 844]]) {
  test(`painting ${width}x${height}: themes, motion and pause`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    const errors = [], models = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (request.url().includes('/scenes/')) models.push(request.url()); });
    await openLandscape(page);
    const canvas = page.locator('[data-landscape-status]');
    const first = await canvas.getAttribute('data-landscape-frames');
    await expect.poll(() => canvas.getAttribute('data-landscape-frames')).not.toBe(first);
    await page.screenshot({ path: info.outputPath('day.png') });
    const hideUI = await page.addStyleTag({ content: 'header, main { visibility: hidden !important; }' });
    await page.screenshot({ path: info.outputPath('landscape-start.png') });
    await page.waitForTimeout(6000); // Record a visible segment of water/cloud motion.
    await page.screenshot({ path: info.outputPath('landscape-end.png') });
    await hideUI.evaluate(node => node.remove());
    await page.getByRole('switch', { name: 'Movimento do cenário', exact: true }).uncheck();
    await page.waitForTimeout(200);
    const paused = await canvas.getAttribute('data-landscape-frames');
    await page.waitForTimeout(500);
    expect(await canvas.getAttribute('data-landscape-frames')).toBe(paused);
    await page.getByRole('button', { name: /^Noite Luar/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
    await page.waitForTimeout(3800);
    await page.screenshot({ path: info.outputPath('night.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(models).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('original castle stays fixed while water pixels change', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLandscape(page);
  await page.addStyleTag({ content: 'header, main { visibility: hidden !important; }' });
  await page.waitForTimeout(4100);
  const castle = { x: 600, y: 300, width: 150, height: 160 };
  const lake = { x: 550, y: 720, width: 250, height: 130 };
  const beforeCastle = await page.screenshot({ clip: castle });
  const beforeLake = await page.screenshot({ clip: lake });
  await page.waitForTimeout(3000);
  expect((await page.screenshot({ clip: castle })).equals(beforeCastle)).toBe(true);
  expect((await page.screenshot({ clip: lake })).equals(beforeLake)).toBe(false);
});

test('reduced motion freezes effects and preserves storage across routes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLandscape(page);
  const canvas = page.locator('[data-landscape-status]');
  await page.waitForTimeout(300);
  const frames = await canvas.getAttribute('data-landscape-frames');
  const before = await page.evaluate(() => localStorage.getItem('rotina-369:data:v1'));
  await page.waitForTimeout(500);
  expect(await canvas.getAttribute('data-landscape-frames')).toBe(frames);
  await page.locator('header').getByRole('link', { name: 'Hoje', exact: true }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(canvas).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('rotina-369:data:v1'))).toBe(before);
});

test('unavailable GPU retains the original photograph and theme controls', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto(route);
  await expect(page.locator('[data-landscape-status]')).toHaveAttribute('data-landscape-status', 'fallback');
  await page.getByRole('button', { name: /^Dia Luz/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await expect(page.locator('.theme-backdrop-day')).toBeVisible();
});

test('lost GPU context stops effects without breaking the dashboard', async ({ page }) => {
  await openLandscape(page);
  await page.locator('[data-landscape-status]').evaluate(canvas => {
    canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
  });
  await expect(page.locator('[data-landscape-status]')).toHaveAttribute('data-landscape-status', 'fallback');
  await page.getByRole('button', { name: /^Noite Luar/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
});
