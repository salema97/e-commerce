/**
 * Test-only authentication bypass for E2E browser tests.
 *
 * This module is a no-op unless the `ENABLE_TEST_AUTH` environment variable is
 * set to `"true"`. When enabled, the API can accept an `X-Test-Auth` header that
 * carries a mock Clerk user id and role, allowing Playwright tests to exercise
 * authenticated flows without real Clerk credentials.
 *
 * Never enable this in production.
 */

import type { Role } from '@repo/shared-types';

const TEST_AUTH_ENABLED = process.env.ENABLE_TEST_AUTH === 'true';
const HEADER_NAME = 'x-test-auth';

export interface TestAuthSession {
  userId: string;
  role: Role;
}

export function isTestAuthEnabled(): boolean {
  return TEST_AUTH_ENABLED;
}

export function getTestAuthSession(headers: Headers): TestAuthSession | null {
  if (!TEST_AUTH_ENABLED) return null;

  const value = headers.get(HEADER_NAME);
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'userId' in parsed &&
      typeof parsed.userId === 'string' &&
      'role' in parsed &&
      typeof parsed.role === 'string'
    ) {
      return { userId: parsed.userId, role: parsed.role as Role };
    }
  } catch {
    // Invalid header format; ignore.
  }

  return null;
}
