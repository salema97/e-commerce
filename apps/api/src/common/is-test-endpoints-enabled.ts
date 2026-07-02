/**
 * Whether dev-only test controllers (e.g. POST /test/payments) are registered.
 *
 * - `APP_ENV=production` → always disabled
 * - `NODE_ENV=test` → enabled (Vitest / E2E)
 * - `APP_ENV=development` → enabled unless `ENABLE_TEST_AUTH=false`
 * - staging / other non-production tiers → only when `ENABLE_TEST_AUTH=true`
 */
export function isTestEndpointsEnabled(): boolean {
  const appEnv = process.env.APP_ENV ?? 'development';

  if (appEnv === 'production') {
    return false;
  }

  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  if (appEnv === 'development') {
    return process.env.ENABLE_TEST_AUTH !== 'false';
  }

  return process.env.ENABLE_TEST_AUTH === 'true';
}
