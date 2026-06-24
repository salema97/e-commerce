import { test, expect } from '@playwright/test';
import {
  authenticatePage,
  clearAuth,
  createTestOrder,
  createCompletedPayment,
  createReturnRequest,
  transitionReturnStatus,
  getApiAuthHeaders,
  TEST_CUSTOMER,
  TEST_ADMIN,
} from './fixtures/auth.js';

const API_BASE = 'http://localhost:3001/v1';

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

    await expect(page.locator('body')).toContainText('Request return');
    await page.getByRole('button', { name: 'Request return' }).click();

    await expect(page).toHaveURL(`/orders/${order.id}/return`);
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[placeholder="Reason for returning this item"]').first().fill('Defective');

    await page.getByRole('button', { name: 'Submit return request' }).click();

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

    await expect(page.locator('body')).toContainText('Returns');
    const row = page.getByRole('row').filter({ hasText: returnRequest.id.slice(0, 8) });
    await row.getByRole('link', { name: 'View' }).click();

    await expect(page).toHaveURL(new RegExp(`/admin/returns/${returnRequest.id}$`));
    await page.getByRole('button', { name: 'Resolve' }).click();

    await expect(page).toHaveURL(`/admin/returns/${returnRequest.id}/resolve`);
    await page.locator('input[value="STORE_CREDIT"]').check();
    await page.getByRole('button', { name: 'Confirm resolution' }).click();

    await expect(page).toHaveURL(`/admin/returns/${returnRequest.id}`, { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Resolved');
  });

  test('guest creates a return request using the order email', async ({ page, request }) => {
    const customerEmail = 'guest@example.com';
    const order = await createTestOrder(request, {
      status: 'DELIVERED',
      customerEmail,
    });
    await createCompletedPayment(request, order.id);

    await clearAuth(page);
    await page.goto(`/orders/${order.id}/return`);

    await expect(page.locator('body')).toContainText('Order email');
    await page.locator('input[type="email"]').fill(customerEmail);
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[placeholder="Reason for returning this item"]').first().fill('Wrong size');

    await page.getByRole('button', { name: 'Submit return request' }).click();

    await expect(page.locator('body')).toContainText('Return request submitted');
    await expect(page.locator('body')).toContainText('Requested');
  });
});
