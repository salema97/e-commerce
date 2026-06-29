import { test, expect } from '@playwright/test';
import { authenticatePage, createTestPromotion, TEST_ADMIN } from './fixtures/auth.js';

test.describe('admin promotions', () => {
  test('created promotion appears in list and placement picker', async ({ page, request }) => {
    const unique = `${Date.now()}`;
    const promo = await createTestPromotion(request, {
      name: `E2E Placement Picker ${unique}`,
    });

    await authenticatePage(page, TEST_ADMIN);
    await page.goto('/admin/marketing/promotions', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('cell', { name: promo.promotionName })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/admin/marketing/placements', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Nuevo placement' }).click();
    await expect(page.getByRole('dialog', { name: 'Nuevo placement' })).toBeVisible();

    await page.locator('#placement-promotion').click();
    await expect(page.getByRole('option', { name: promo.promotionName })).toBeVisible();
  });

  test('admin can add coupon on promotion detail', async ({ page, request }) => {
    const promo = await createTestPromotion(request);
    const newCode = `DETAIL${Date.now().toString().slice(-6)}`;

    await authenticatePage(page, TEST_ADMIN);
    await page.goto(`/admin/marketing/promotions/${promo.promotionId}`, {
      waitUntil: 'domcontentloaded',
    });

    await page.getByLabel('Código').fill(newCode);
    await page.getByRole('button', { name: 'Añadir cupón' }).click();

    await expect(page.getByRole('cell', { name: newCode })).toBeVisible({ timeout: 15_000 });
  });
});
