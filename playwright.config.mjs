import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './outputs/scene-browser',
  timeout: 60000,
  workers: 1,
  use: { baseURL: process.env.SCENE_TEST_URL || 'http://localhost:3000', channel: process.env.SCENE_BROWSER || 'chrome', headless: true },
});
