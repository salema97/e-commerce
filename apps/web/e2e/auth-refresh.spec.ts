import { test, expect } from '@playwright/test';
import { authenticatePage, TEST_CUSTOMER } from './fixtures/auth.js';

test.describe('auth refresh', () => {
  test('POST /api/auth/refresh succeeds after login', async ({ page }) => {
    await authenticatePage(page, TEST_CUSTOMER);

    const response = await page.request.post('/api/auth/refresh');
    expect(response.ok()).toBe(true);

    const body = (await response.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
  });
});
