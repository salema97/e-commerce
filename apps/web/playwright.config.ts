import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_EVOLUTION_WEBHOOK_SECRET } from './e2e/fixtures/webhook-secret.js';
import { E2E_API_BASE } from './e2e/fixtures/api-base.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const E2E_HOST = '127.0.0.1';

loadEnv({ path: resolve(__dirname, '../api/.env') });
loadEnv({ path: resolve(__dirname, '.env.local'), override: true });

const authJwtSecret = process.env.AUTH_JWT_ACCESS_SECRET;
if (!authJwtSecret) {
  throw new Error(
    'AUTH_JWT_ACCESS_SECRET is required for Playwright E2E. Set it in apps/api/.env (must match apps/web/.env.local).',
  );
}

process.env.EVOLUTION_WEBHOOK_SECRET ??= E2E_EVOLUTION_WEBHOOK_SECRET;

const forceFreshServer = process.env.PLAYWRIGHT_FORCE_FRESH_SERVER === '1';
const reuseExistingServer =
  !forceFreshServer && (!process.env.CI || process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1');

const e2eServerEnv = {
  AUTH_JWT_ACCESS_SECRET: authJwtSecret,
  NEXT_PUBLIC_API_BASE_URL: E2E_API_BASE,
  API_BASE_URL: E2E_API_BASE,
  CORS_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: process.env.PLAYWRIGHT_FORCE_FRESH_SERVER === '1' ? 2 : process.env.CI ? 1 : 4,
  reporter: 'list',
  use: {
    baseURL: `http://${E2E_HOST}:3000`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'api',
      command: 'pnpm --filter @repo/api start:dev',
      cwd: resolve(__dirname, '../..'),
      url: `${E2E_API_BASE}/health`,
      reuseExistingServer,
      timeout: 180_000,
      env: e2eServerEnv,
    },
    {
      name: 'web',
      command: 'pnpm exec next dev --webpack --port 3000',
      url: `http://${E2E_HOST}:3000`,
      reuseExistingServer,
      timeout: 120_000,
      dependencies: ['api'],
      env: e2eServerEnv,
    },
  ],
});
