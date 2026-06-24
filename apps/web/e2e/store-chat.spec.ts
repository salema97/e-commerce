import { test, expect } from '@playwright/test';
import { dismissCookieBanner, presetCookieConsent } from './fixtures/auth.js';

test.describe('storefront chat widget', () => {
  test('opens chat, sends a message, and shows it in the thread', async ({ page }) => {
    await presetCookieConsent(page);
    await page.goto('/store');
    await dismissCookieBanner(page);

    await page.getByRole('button', { name: '¿Necesitas ayuda?' }).click();
    await expect(page.getByText('Soporte en línea')).toBeVisible();

    const message = 'Hola, tengo una pregunta sobre envíos';
    await page.getByPlaceholder('Escribe tu mensaje...').fill(message);
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText(message)).toBeVisible({ timeout: 15_000 });
  });
});
