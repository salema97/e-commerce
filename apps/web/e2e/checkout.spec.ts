import { test, expect } from '@playwright/test';
import { presetCookieConsent } from './fixtures/auth.js';

test.describe('checkout e2e', () => {
  test('guest can open checkout with items in cart', async ({ page }) => {
    await presetCookieConsent(page);
    await page.goto('/store', { waitUntil: 'domcontentloaded' });

    const addButton = page.getByRole('button', { name: /añadir|agregar|add to cart/i }).first();
    await expect(addButton).toBeVisible({ timeout: 15_000 });
    await addButton.click();

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/checkout|pago|envío|total/i);
  });
});
