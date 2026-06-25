import { test, expect } from '@playwright/test';

test.describe('smoke staging', () => {
  test('store page loads', async ({ page }) => {
    await page.goto('/store');
    await expect(page).toHaveTitle(/E-commerce|Store/i);
  });

  test('legal privacy page loads', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('body')).toBeVisible();
  });
});
