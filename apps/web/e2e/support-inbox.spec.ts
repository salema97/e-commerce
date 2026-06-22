import { test, expect } from '@playwright/test';
import { authenticatePage, TEST_ADMIN, TEST_SUPPORT } from './fixtures/auth.js';
import { createConversationViaWebhook } from './fixtures/support.js';

test.describe('admin support inbox e2e', () => {
  test('support agent views conversation list and sends a reply', async ({ page, request }) => {
    await createConversationViaWebhook(request, {
      content: 'Hola, tengo una duda',
      contactName: 'Cliente de prueba',
    });

    await authenticatePage(page, TEST_SUPPORT);
    await page.goto('/admin/support');

    await expect(page.locator('body')).toContainText('Bandeja de soporte');
    await expect(page.locator('body')).toContainText('Cliente de prueba');

    await page.getByText('Cliente de prueba').click();
    await expect(page.locator('body')).toContainText('Hola, tengo una duda');

    const reply = 'Gracias por contactarnos. ¿En qué podemos ayudarte?';
    await page.locator('textarea[placeholder="Escribe una respuesta..."]').fill(reply);
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.locator('body')).toContainText(reply);
  });

  test('admin updates conversation status and assigns to self', async ({ page, request }) => {
    await createConversationViaWebhook(request, {
      content: 'Necesito ayuda con mi pedido',
      contactName: 'Otro Cliente',
    });

    await authenticatePage(page, TEST_ADMIN);
    await page.goto('/admin/support');

    await page.getByText('Otro Cliente').click();

    await page.locator('select[aria-label="Estado de la conversación"]').selectOption('PENDING');
    await expect(page.locator('body')).toContainText('Pendiente');

    await page.getByRole('button', { name: 'Asignarme' }).click();
    await expect(page.locator('body')).toContainText('Asignado');
  });

  test('non-support admin role cannot access support inbox', async ({ page }) => {
    // Finance role has no support access.
    await authenticatePage(page, { userId: 'test_finance_user', role: 'FINANCE' });
    await page.goto('/admin/support');

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
