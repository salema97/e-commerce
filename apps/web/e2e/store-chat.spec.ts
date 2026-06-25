import { test, expect } from '@playwright/test';
import { dismissCookieBanner, presetCookieConsent } from './fixtures/auth.js';

test.describe('storefront chat widget', () => {
  test('opens chat, sends a message, and shows it in the thread', async ({ page }) => {
    await presetCookieConsent(page);
    await page.goto('/store');
    await dismissCookieBanner(page);

    await page.getByTestId('store-chat-open').click();
    await expect(page.getByTestId('store-chat-panel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeEnabled({ timeout: 15_000 });

    const message = 'Hola, tengo una pregunta sobre envíos';
    await page.getByPlaceholder('Escribe tu mensaje...').fill(message);
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText(message)).toBeVisible({ timeout: 15_000 });
  });
});
