import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { E2E_EVOLUTION_WEBHOOK_SECRET } from './e2e/fixtures/webhook-secret.js';

loadEnv({ path: resolve(__dirname, '../api/.env') });
loadEnv({ path: resolve(__dirname, '.env.local'), override: true });

const authJwtSecret = process.env.AUTH_JWT_ACCESS_SECRET;
if (!authJwtSecret) {
  throw new Error(
    'AUTH_JWT_ACCESS_SECRET is required for Playwright E2E. Set it in apps/api/.env (must match apps/web/.env.local).',
  );
}

process.env.EVOLUTION_WEBHOOK_SECRET ??= E2E_EVOLUTION_WEBHOOK_SECRET;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      AUTH_JWT_ACCESS_SECRET: authJwtSecret,
    },
  },
});
