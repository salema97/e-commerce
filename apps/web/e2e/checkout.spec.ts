import { test, expect } from '@playwright/test';
import { createTestProduct, presetCookieConsent } from './fixtures/auth.js';

test.describe('checkout e2e', () => {
  test('guest can open checkout with items in cart', async ({ page, request }) => {
    const product = await createTestProduct(request);

    await presetCookieConsent(page);
    await page.goto(`/store/${product.slug}`, { waitUntil: 'domcontentloaded' });

    const addButton = page.getByRole('button', { name: /agregar al carrito/i });
    await expect(addButton).toBeVisible({ timeout: 15_000 });
    await addButton.click();

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/checkout|pago|envío|total/i);
  });
});
