import { defineConfig } from '@playwright/test';

const E2E_PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    headless: true,
  },
  webServer: [
    {
      command: 'npm run gateway',
      port: 8787,
      reuseExistingServer: true,
      timeout: 10_000,
    },
    {
      command: `vite --config apps/web/vite.config.ts --host 0.0.0.0 --port ${E2E_PORT}`,
      port: E2E_PORT,
      reuseExistingServer: true,
      timeout: 15_000,
    },
  ],
});
