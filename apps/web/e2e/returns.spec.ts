import { test, expect } from '@playwright/test';

test.describe('returns e2e', () => {
  test('customer navigates to order return page and sees the request form', async ({ page }) => {
    await page.goto('/orders/00000000-0000-0000-0000-000000000000/return');
    await expect(page.locator('body')).toContainText('Request return');
  });

  test('admin navigates to returns list page and sees the list', async ({ page }) => {
    await page.goto('/admin/returns');
    await expect(page.locator('body')).toContainText('Returns');
  });
});
