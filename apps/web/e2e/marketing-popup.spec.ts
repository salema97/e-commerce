import { test, expect } from '@playwright/test';
import { presetCookieConsent } from './fixtures/auth.js';

const activePlacementsFixture = {
  APP_LAUNCH: {
    popup: {
      id: 'e2e-popup',
      type: 'POPUP',
      slot: 'APP_LAUNCH',
      title: 'E2E Promo Popup',
      body: 'Oferta de prueba automatizada',
      imageUrl: null,
      ctaLabel: 'Ver ofertas',
      ctaHref: '/store',
      promotionId: null,
      priority: 100,
      contentVersion: 1,
      showOncePerSession: false,
      showOnceEver: false,
      dismissible: true,
    },
    banners: [],
    promoStrips: [],
  },
  HOME_HERO: { banners: [], promoStrips: [] },
  STORE_TOP: { banners: [], promoStrips: [] },
  STORE_INLINE: { banners: [], promoStrips: [] },
};

async function mockActivePlacements(page: import('@playwright/test').Page) {
  await page.route('**/marketing/placements/active**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(activePlacementsFixture),
    });
  });
}

test.describe('marketing launch popup', () => {
  test('shows launch popup and hides on dismiss when consent is preset', async ({ page }) => {
    await mockActivePlacements(page);
    await presetCookieConsent(page);

    const placementsResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/marketing/placements/active') && response.status() === 200,
    );
    await page.goto('/');
    await placementsResponse;

    await expect(page.getByTestId('marketing-launch-popup')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'E2E Promo Popup' })).toBeVisible();

    await page.getByTestId('marketing-popup-dismiss').click();

    await expect(page.getByTestId('marketing-launch-popup')).not.toBeVisible();
  });

  test('defers placement fetch until cookie consent is accepted', async ({ page }) => {
    let activeFetches = 0;
    await page.addInitScript(() => {
      localStorage.removeItem('ecommerce-consent-v1');
    });
    await page.route('**/marketing/placements/active**', async (route) => {
      activeFetches += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activePlacementsFixture),
      });
    });

    await page.goto('/');

    await expect(page.getByTestId('marketing-launch-popup')).not.toBeVisible();
    await expect.poll(() => activeFetches, { timeout: 5_000 }).toBe(0);

    const acceptButton = page.getByRole('button', { name: 'Aceptar todo' });
    await expect(acceptButton).toBeVisible({ timeout: 10_000 });

    const placementsResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/marketing/placements/active') && response.status() === 200,
    );
    await acceptButton.click();
    await placementsResponse;

    await expect(page.getByTestId('marketing-launch-popup')).toBeVisible();
    await expect.poll(() => activeFetches).toBe(1);
  });
});
