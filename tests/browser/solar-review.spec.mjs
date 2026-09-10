import { test, expect } from '@playwright/test';

const route = '/configuracoes/aparencia';
async function prepare(page, automatic = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(mode => {
    localStorage.setItem('dayforge:appearance:v1', JSON.stringify({ version: 1, mode: mode ? 'automatic' : 'manual', manualTheme: 'day', cityId: mode ? 'goiania' : null, ambientMotion: false }));
    localStorage.setItem('dayforge:theme:v1', 'day');
  }, automatic);
  await page.goto(route);
  await expect(page.getByRole('button', { name: /^Dia Luz/ })).toBeEnabled();
}

for (const [width, height] of [[1440, 900], [1007, 552], [390, 844]]) {
  test(`tower clips part, then all, then none of the solar disc ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await prepare(page);
    await page.screenshot({ path: info.outputPath('heading-day.png') });
    await page.getByRole('button', { name: /^Noite Luar/ }).click();
    await page.screenshot({ path: info.outputPath('heading-night.png') });
    await page.getByRole('button', { name: /^Dia Luz/ }).click();
    await page.addStyleTag({ content: 'header, main { visibility:hidden!important; }' });
    const sky = page.locator('[data-celestial-sky]');
    const scale = Math.max(width / 1536, height / 1024);
    const point = (x, y) => ({ x: x * scale + (width - 1536 * scale) / 2, y: y * scale + (height - 1024 * scale) / 2 });
    const sample = async (x, y) => page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: 2, height: 2 } });
    // Exercise the actual browser mask at the tip and wider body of the main
    // tower. Move only the celestial test fixture; the painting/matte stay fixed.
    for (const [name, x, y, covered] of [['partial', 715, 150, true], ['hidden', 715, 238, true], ['clear', 785, 180, false]]) {
      const center = point(x, y);
      await sky.evaluate((element, center) => {
        const disc = element.firstElementChild;
        disc.getAnimations().forEach(animation => animation.cancel());
        disc.style.transform = `translate3d(${center.x - 17}px,${center.y - 17}px,0)`;
        disc.children[0].style.opacity = '1';
        disc.children[1].style.opacity = '0';
        element.style.opacity = '0';
      }, center);
      const base = await sample(center.x, center.y);
      const baseSide = await sample(center.x - 12, center.y);
      await sky.evaluate(element => { element.style.opacity = '1'; });
      expect((await sample(center.x, center.y)).equals(base), `${name}: center covered`).toBe(covered);
      if (name === 'partial') expect((await sample(center.x - 12, center.y)).equals(baseSide), 'edge of disc remains in open sky').toBe(false);
      if (name === 'hidden') expect((await sample(center.x - 12, center.y)).equals(baseSide), 'whole disc behind wide roof').toBe(true);
      await page.screenshot({ path: info.outputPath(`sun-${name}.png`) });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('automatic light follows Goiania from morning through orange sunset to night', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-09-10T08:00:00-03:00'));
  await prepare(page, true);
  await expect(page.getByRole('switch', { name: 'Acompanhar o sol', exact: true })).toBeChecked();
  const positions = [];
  for (const [name, time, theme] of [['morning', '08:00', 'day'], ['noon', '12:00', 'day'], ['sunset', '18:05', 'day'], ['night', '19:15', 'night']]) {
    await page.clock.setFixedTime(new Date(`2026-09-10T${time}:00-03:00`));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect.poll(() => page.locator('[data-celestial-sky] > div').first().getAttribute('style')).toBeTruthy();
    // Let the focus-triggered clock update and zero-duration effects settle.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    positions.push(await page.locator('[data-celestial-sky] > div').first().evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41));
    if (name === 'sunset') {
      const twilight = page.locator('[class*="twilight"]').first();
      await expect.poll(() => twilight.evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.65);
    }
    await page.screenshot({ path: info.outputPath(`${name}.png`) });
  }
  expect(positions[1]).toBeGreaterThan(positions[0]);
  expect(positions[2]).toBeGreaterThan(positions[1]);
  expect(errors).toEqual([]);
});
