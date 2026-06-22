/**
 * Test-only authentication bypass for E2E browser tests.
 *
 * This module is a no-op unless the `ENABLE_TEST_AUTH` environment variable is
 * set to `"true"`. When enabled, the app can accept a `__test_auth` cookie that
 * carries a mock Clerk user id and role, allowing Playwright tests to exercise
 * authenticated flows without real Clerk credentials.
 *
 * Never enable this in production.
 */

import { cookies } from 'next/headers';
import type { Role } from '@repo/shared-types';

const TEST_AUTH_ENABLED = process.env.ENABLE_TEST_AUTH === 'true';
const COOKIE_NAME = '__test_auth';

export interface TestAuthSession {
  userId: string;
  role: Role;
}

export function isTestAuthEnabled(): boolean {
  return TEST_AUTH_ENABLED;
}

export async function getTestAuthSession(): Promise<TestAuthSession | null> {
  if (!TEST_AUTH_ENABLED) return null;

  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cookie.value, 'base64url').toString('utf8')) as unknown;
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
    // Invalid cookie format; ignore.
  }

  return null;
}

export function encodeTestAuthSession(session: TestAuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64url');
}

export { COOKIE_NAME };
