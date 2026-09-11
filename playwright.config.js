// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8123',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx http-server -p 8123 -s .',
    url: 'http://127.0.0.1:8123/qarchkhor.html',
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
});
