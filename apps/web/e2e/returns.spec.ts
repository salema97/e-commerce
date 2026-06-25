import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
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

import { E2E_API_BASE } from './fixtures/api-base.js';

const API_BASE = E2E_API_BASE;

async function selectFirstReturnItem(page: Page): Promise<void> {
  await expect(page.getByTestId('return-request-form')).toBeVisible();
  const checkbox = page.getByTestId(/^return-item-/).first();
  await expect(checkbox).toBeVisible({ timeout: 15_000 });
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('data-state', 'checked', { timeout: 10_000 });
  await expect(
    page.getByPlaceholder('Motivo de la devolución de este artículo').first(),
  ).toBeVisible({ timeout: 10_000 });
}

async function expectReturnForOrder(
  request: APIRequestContext,
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
    await page.goto(`/orders/${order.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toContainText('Solicitar devolución');
    await page.getByRole('button', { name: 'Solicitar devolución' }).click();

    await expect(page).toHaveURL(`/orders/${order.id}/return`);
    await selectFirstReturnItem(page);
    await page
      .getByPlaceholder('Motivo de la devolución de este artículo')
      .first()
      .fill('Defectuoso');

    const submitButton = page.getByRole('button', { name: 'Enviar solicitud de devolución' });
    await expect(submitButton).toBeEnabled({ timeout: 15_000 });
    await submitButton.click();

    await expect(page).toHaveURL(`/orders/${order.id}`, { timeout: 15_000 });
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
    await page.goto(`/admin/returns/${returnRequest.id}`);

    await expect(page).toHaveURL(new RegExp(`/admin/returns/${returnRequest.id}$`));
    await page.getByRole('button', { name: 'Resolver' }).click();

    await expect(page).toHaveURL(`/admin/returns/${returnRequest.id}/resolve`);
    await expect(page.getByTestId('resolve-return-form')).toBeVisible();
    await page.getByRole('radio', { name: 'Pago original' }).click();
    const confirmButton = page.getByRole('button', { name: 'Confirmar resolución' });
    await expect(confirmButton).toBeEnabled({ timeout: 15_000 });

    const [resolveResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/returns/${returnRequest.id}/resolve`) &&
          response.request().method() === 'POST',
        { timeout: 30_000 },
      ),
      confirmButton.click(),
    ]);
    expect(resolveResponse.ok()).toBeTruthy();

    await page.goto(`/admin/returns/${returnRequest.id}`);
    await expect(page.locator('body')).toContainText('Resuelta', { timeout: 15_000 });
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

    const submitButton = page.getByRole('button', { name: 'Enviar solicitud de devolución' });
    await expect(submitButton).toBeEnabled({ timeout: 15_000 });
    await submitButton.click();

    await expect(page.locator('body')).toContainText('Solicitud de devolución enviada', {
      timeout: 15_000,
    });
    await expect(page.locator('body')).toContainText('Solicitada');
  });
});
