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

  test('admin route redirects anonymous users to sign-in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('account route redirects anonymous users to sign-in', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('security headers include csp nonce and cross-origin policies', async ({ request }) => {
    const response = await request.get('/store');
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['content-security-policy']).toMatch(/'nonce-[^']+'/);
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  });
});
