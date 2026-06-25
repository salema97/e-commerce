import { test, expect } from '@playwright/test';
import {
  authenticatePage,
  clearAuth,
  createTestOrder,
  createCompletedPayment,
  createReturnRequest,
  presetCookieConsent,
  transitionReturnStatus,
  getApiAuthHeaders,
  TEST_CUSTOMER,
  TEST_ADMIN,
} from './fixtures/auth.js';

const API_BASE = 'http://localhost:3001/v1';

async function selectFirstReturnItem(page: import('@playwright/test').Page): Promise<void> {
  const checkbox = page.getByRole('checkbox').first();
  await checkbox.click();
  if ((await checkbox.getAttribute('data-state')) !== 'checked') {
    await checkbox.click({ force: true });
  }
  await expect(checkbox).toHaveAttribute('data-state', 'checked');
}

async function expectReturnForOrder(
  request: import('@playwright/test').APIRequestContext,
  orderId: string,
): Promise<void> {
  const res = await request.get(`${API_BASE}/returns?orderId=${orderId}&limit=1`, {
    headers: await getApiAuthHeaders(request, 'ADMIN'),
  });
  if (!res.ok()) {
    throw new Error(`Failed to list returns: ${await res.text()}`);
  }
  const body = (await res.json()) as Array<{ id: string }>;
  if (!body.length) {
    throw new Error(`No return found for order ${orderId}`);
  }
}

test.describe('returns e2e', () => {
  test('customer creates a return request from the order detail page', async ({ page, request }) => {
    const order = await createTestOrder(request, {
      status: 'DELIVERED',
      customerEmail: 'cliente@example.com',
    });

    await authenticatePage(page, TEST_CUSTOMER);
    await page.goto(`/orders/${order.id}`);

    await expect(page.locator('body')).toContainText('Solicitar devolución');
    await page.getByRole('button', { name: 'Solicitar devolución' }).click();

    await expect(page).toHaveURL(`/orders/${order.id}/return`);
    await selectFirstReturnItem(page);
    await page
      .getByPlaceholder('Motivo de la devolución de este artículo')
      .first()
      .fill('Defectuoso');

    await page.getByRole('button', { name: 'Enviar solicitud de devolución' }).click();

    await expect(page).toHaveURL(`/orders/${order.id}`, { timeout: 15000 });
    await expectReturnForOrder(request, order.id);
  });

  test('admin resolves a pending return request', async ({ page, request }) => {
    const order = await createTestOrder(request, {
      status: 'DELIVERED',
      customerEmail: 'cliente@example.com',
    });
    await createCompletedPayment(request, order.id);
    const returnRequest = await createReturnRequest(request, order.id, TEST_CUSTOMER);
    await transitionReturnStatus(request, returnRequest.id, 'APPROVED');
    await transitionReturnStatus(request, returnRequest.id, 'INSPECTION');

    await authenticatePage(page, TEST_ADMIN);
    await page.goto('/admin/returns');

    await expect(page.locator('body')).toContainText('Devoluciones');
    const row = page.getByRole('row').filter({ hasText: returnRequest.id.slice(0, 8) });
    await row.getByRole('link', { name: 'Ver' }).click();

    await expect(page).toHaveURL(new RegExp(`/admin/returns/${returnRequest.id}$`));
    await page.getByRole('button', { name: 'Resolver' }).click();

    await expect(page).toHaveURL(`/admin/returns/${returnRequest.id}/resolve`);
    await page.getByRole('radio', { name: 'Crédito en tienda' }).click();
    await page.getByRole('button', { name: 'Confirmar resolución' }).click();

    await expect(page).toHaveURL(`/admin/returns/${returnRequest.id}`, { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Resuelta');
  });

  test('guest creates a return request using the order email', async ({ page, request }) => {
    const customerEmail = 'guest@example.com';
    const order = await createTestOrder(request, {
      status: 'DELIVERED',
      customerEmail,
    });
    await createCompletedPayment(request, order.id);

    await clearAuth(page);
    await presetCookieConsent(page);
    await page.goto(`/orders/${order.id}/return`);

    await expect(page.locator('body')).toContainText('Correo del pedido');
    await page.locator('input[type="email"]').fill(customerEmail);
    await selectFirstReturnItem(page);
    await page
      .getByPlaceholder('Motivo de la devolución de este artículo')
      .first()
      .fill('Talla incorrecta');

    await page.getByRole('button', { name: 'Enviar solicitud de devolución' }).click();

    await expect(page.locator('body')).toContainText('Solicitud de devolución enviada');
    await expect(page.locator('body')).toContainText('Solicitada');
  });
});
