import { test, expect } from '@playwright/test';

const route = '/configuracoes/aparencia?scene=3d';
for (const backend of ['auto', 'webgl2']) {
  for (const [width, height] of [[1440, 900], [1024, 768], [390, 844]]) {
    test(`${backend} ${width}x${height}: theme, framing and idle`, async ({ page }, info) => {
      await page.setViewportSize({ width, height });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(route + (backend === 'webgl2' ? '&renderer=webgl2' : ''));
      const scene = page.locator('[data-scene-status]');
      await expect(scene).toHaveAttribute('data-scene-status', 'ready', { timeout: 45000 });
      if (backend === 'webgl2') await expect(scene).toHaveAttribute('data-scene-backend', 'WebGL 2');
      for (const [theme, button] of [['day', /^Dia Luz/], ['night', /^Noite Luar/]]) {
        await page.getByRole('button', { name: button }).click();
        await expect(scene).toHaveAttribute('data-theme', theme);
        await page.screenshot({ path: info.outputPath(`${theme}.png`) });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const canvas = scene.locator('canvas');
      await expect(canvas).toHaveAttribute('data-scene-frames', /\d+/);
      const frames = await canvas.getAttribute('data-scene-frames');
      await page.waitForTimeout(1000); // Measure on-demand idle rendering, not an arbitrary load wait.
      expect(await canvas.getAttribute('data-scene-frames')).toBe(frames);
      await info.attach('metrics', { body: JSON.stringify({ backend: await scene.getAttribute('data-scene-backend'), readyMs: await canvas.getAttribute('data-scene-ready-ms'), frames, width, height }), contentType: 'application/json' });
      const hideUI = await page.addStyleTag({ content: 'header, main, aside { visibility: hidden !important; }' });
      await page.screenshot({ path: info.outputPath('castle-isolated-night.png') });
      await hideUI.evaluate(node => node.remove());
      expect(errors).toEqual([]);
    });
  }
}

test('missing asset retains usable appearance controls', async ({ page }) => {
  await page.route('**/scenes/castle/castle.glb', route => route.abort());
  await page.goto(route);
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-scene-status', 'fallback', { timeout: 45000 });
  await page.getByRole('button', { name: /^Dia Luz/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await expect(page.locator('[data-scene-status] canvas')).toHaveCount(0);
});

test('normal route does not request 3D assets', async ({ page }) => {
  const assets = [];
  page.on('request', request => { if (request.url().includes('/scenes/')) assets.push(request.url()); });
  await page.goto('/configuracoes/aparencia');
  await expect(page.getByRole('button', { name: /^Dia Luz/ })).toBeEnabled();
  await expect(page.locator('[data-scene-status]')).toHaveCount(0);
  expect(assets).toEqual([]);
});

test('navigation retains one scene and planner storage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let models = 0;
  page.on('request', request => { if (request.url().endsWith('/castle.glb')) models++; });
  await page.goto(route);
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-scene-status', 'ready', { timeout: 45000 });
  const before = await page.evaluate(() => localStorage.getItem('rotina-369:data:v1'));
  await page.locator('header').getByRole('link', { name: 'Hoje', exact: true }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.locator('[data-scene-status] canvas')).toHaveCount(1);
  expect(models).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('rotina-369:data:v1'))).toBe(before);
});

test('unavailable graphics retains static fallback', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2' || type === 'webgl' || type === 'webgpu') return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto(route + '&renderer=webgl2');
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-scene-status', 'fallback', { timeout: 45000 });
  await expect(page.getByRole('button', { name: /^Dia Luz/ })).toBeEnabled();
});
