import { test, expect } from '@playwright/test';
import { authenticatePage, TEST_ADMIN, TEST_FINANCE, TEST_SUPPORT } from './fixtures/auth.js';
import { createConversationViaWebhook } from './fixtures/support.js';

test.describe('admin support inbox e2e', () => {
  test('support agent views conversation list and sends a reply', async ({ page, request }) => {
    const contactName = `Cliente de prueba ${Date.now()}`;
    await createConversationViaWebhook(request, {
      content: 'Hola, tengo una duda',
      contactName,
    });

    await authenticatePage(page, TEST_SUPPORT);
    await page.goto('/admin/support');

    await expect(page.locator('body')).toContainText('Bandeja de soporte');
    await expect(page.locator('body')).toContainText(contactName);

    await page.getByText(contactName).click();
    await expect(page.locator('body')).toContainText('Hola, tengo una duda');

    const reply = 'Gracias por contactarnos. ¿En qué podemos ayudarte?';
    await page.locator('textarea[placeholder="Escribe una respuesta..."]').fill(reply);
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.locator('body')).toContainText(reply);
  });

  test('admin updates conversation status and assigns to self', async ({ page, request }) => {
    const contactName = `Otro Cliente ${Date.now()}`;
    await createConversationViaWebhook(request, {
      content: 'Necesito ayuda con mi pedido',
      contactName,
    });

    await authenticatePage(page, TEST_ADMIN);
    await page.goto('/admin/support');

    await expect(page.locator('body')).toContainText(contactName);
    await page.getByText(contactName).click();

    await page.locator('select[aria-label="Estado de la conversación"]').selectOption('PENDING');
    await expect(page.locator('body')).toContainText('Pendiente');

    await page.getByRole('button', { name: 'Asignarme' }).click();
    await expect(page.locator('body')).toContainText('Asignado');
  });

  test('support agent marks a conversation as resolved', async ({ page, request }) => {
    const contactName = `Cliente Resuelto ${Date.now()}`;
    await createConversationViaWebhook(request, {
      content: 'Mi duda fue resuelta, gracias',
      contactName,
    });

    await authenticatePage(page, TEST_SUPPORT);
    await page.goto('/admin/support');

    await expect(page.locator('body')).toContainText(contactName);
    await page.getByText(contactName).click();

    await page.locator('select[aria-label="Estado de la conversación"]').selectOption('RESOLVED');
    await expect(page.locator('body')).toContainText('Resuelto');

    await page.goto('/admin/support');
    await expect(page.locator('body')).toContainText(contactName);
  });

  test('non-support admin role cannot access support inbox', async ({ page }) => {
    // Finance role has no support access.
    await authenticatePage(page, TEST_FINANCE);
    await page.goto('/admin/support');

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
