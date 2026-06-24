import { test, expect } from '@playwright/test';
import { authenticatePage, TEST_ADMIN, TEST_FINANCE, TEST_SUPPORT } from './fixtures/auth.js';
import { createConversationViaWebhook } from './fixtures/support.js';

async function openConversation(
  page: import('@playwright/test').Page,
  contactName: string,
): Promise<void> {
  const row = page.getByRole('button', { name: contactName });
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.click();
}

async function selectConversationStatus(
  page: import('@playwright/test').Page,
  label: string,
): Promise<void> {
  const combobox = page.getByRole('combobox', { name: 'Estado de la conversación' });
  await expect(combobox).toBeVisible({ timeout: 10000 });
  await combobox.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

test.describe('admin support inbox e2e', () => {
  test('support agent views conversation list and sends a reply', async ({ page, request }) => {
    const contactName = `Cliente de prueba ${Date.now()}`;
    await createConversationViaWebhook(request, {
      content: 'Hola, tengo una duda',
      contactName,
    });

    await authenticatePage(page, TEST_SUPPORT);
    await page.goto('/admin/support');

    await expect(page.locator('body')).toContainText('Bandeja de conversaciones WhatsApp');
    await expect(page.locator('body')).toContainText(contactName);

    await openConversation(page, contactName);
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
    await openConversation(page, contactName);

    await selectConversationStatus(page, 'Pendiente');
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
    await openConversation(page, contactName);

    await selectConversationStatus(page, 'Resuelto');
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
