import { test, expect } from '@playwright/test';
import {
  authenticatePage,
  clearAuth,
  createTestOrder,
  createCompletedPayment,
  createReturnRequest,
  transitionReturnStatus,
  TEST_CUSTOMER,
  TEST_ADMIN,
} from './fixtures/auth.js';

test.describe('returns e2e', () => {
  test('customer creates a return request from the order detail page', async ({ page, request }) => {
    const order = await createTestOrder(request, {
      status: 'DELIVERED',
      customerEmail: 'customer@example.com',
    });

    await authenticatePage(page, TEST_CUSTOMER);
    await page.goto(`/orders/${order.id}`);

    await expect(page.locator('body')).toContainText('Request return');
    await page.getByRole('button', { name: 'Request return' }).click();

    await expect(page).toHaveURL(`/orders/${order.id}/return`);
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[placeholder="Reason for returning this item"]').first().fill('Defective');

    await page.getByRole('button', { name: 'Submit return request' }).click();

    await expect(page).toHaveURL(`/orders/${order.id}`);
    await expect(page.locator('body')).toContainText('Requested');
  });

  test('admin resolves a pending return request', async ({ page, request }) => {
    const order = await createTestOrder(request, {
      status: 'DELIVERED',
      customerEmail: 'customer@example.com',
    });
    const returnRequest = await createReturnRequest(request, order.id, TEST_CUSTOMER);
    await transitionReturnStatus(request, returnRequest.id, 'APPROVED');
    await transitionReturnStatus(request, returnRequest.id, 'INSPECTION');

    await authenticatePage(page, TEST_ADMIN);
    await page.goto('/admin/returns');

    await expect(page.locator('body')).toContainText('Returns');
    await page.getByRole('link', { name: 'View' }).first().click();

    await expect(page).toHaveURL(new RegExp(`/admin/returns/${returnRequest.id}$`));
    await page.getByRole('button', { name: 'Resolve' }).click();

    await expect(page).toHaveURL(`/admin/returns/${returnRequest.id}/resolve`);
    await page.locator('input[value="ORIGINAL_PAYMENT"]').check();
    await page.getByRole('button', { name: 'Confirm resolution' }).click();

    await expect(page).toHaveURL(`/admin/returns/${returnRequest.id}`);
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

    await expect(page).toHaveURL(`/orders/${order.id}`);
    await expect(page.locator('body')).toContainText('Requested');
  });
});
