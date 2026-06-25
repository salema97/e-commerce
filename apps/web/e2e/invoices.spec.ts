import { test, expect } from '@playwright/test';
import { authenticatePage, TEST_ADMIN, TEST_FINANCE, TEST_SUPPORT, createTestOrder } from './fixtures/auth.js';
import { createTestInvoice } from './fixtures/invoices.js';

const TEST_FINANCE_USER = TEST_FINANCE;

test.describe('admin invoice UI e2e', () => {
  test('finance user views invoice list and navigates to detail', async ({ page, request }) => {
    const order = await createTestOrder(request, { status: 'DELIVERED' });
    const invoice = await createTestInvoice(request, order.id, {
      status: 'DRAFT',
    });

    await authenticatePage(page, TEST_FINANCE_USER);
    await page.goto('/admin/invoices');

    await expect(page.locator('body')).toContainText('Facturación');
    await expect(page.locator('body')).toContainText(invoice.accessKey.slice(0, 20));

    const row = page.getByRole('row').filter({ hasText: invoice.accessKey.slice(0, 20) });
    await row.getByRole('button', { name: 'Ver' }).click();
    await expect(page).toHaveURL(`/admin/invoices/${invoice.id}`);
    await expect(page.locator('body')).toContainText('Clave de acceso');
    await expect(page.locator('body')).toContainText(invoice.accessKey);
  });

  test('admin retries a failed invoice', async ({ page, request }) => {
    const order = await createTestOrder(request, { status: 'DELIVERED' });
    const invoice = await createTestInvoice(request, order.id, {
      status: 'FAILED',
    });

    await authenticatePage(page, TEST_ADMIN);
    await page.goto(`/admin/invoices/${invoice.id}`);

    await expect(page.locator('body')).toContainText('falló');

    // Retry triggers the server action; the button becomes disabled while pending.
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByRole('button', { name: 'Reintentando...' })).toBeDisabled();

    // After invalidation the status may update depending on queue behavior.
    // We assert the page remains on the detail view.
    await expect(page).toHaveURL(`/admin/invoices/${invoice.id}`);
  });

  test('non-finance role cannot access invoice admin pages', async ({ page }) => {
    await authenticatePage(page, TEST_SUPPORT);
    await page.goto('/admin/invoices');

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('filters invoices by status', async ({ page, request }) => {
    const order = await createTestOrder(request, { status: 'DELIVERED' });
    await createTestInvoice(request, order.id, { status: 'FAILED' });

    await authenticatePage(page, TEST_FINANCE_USER);
    await page.goto('/admin/invoices');

    await page.getByRole('combobox', { name: 'Filtrar por estado' }).click();
    await page.getByRole('option', { name: 'Fallida' }).click();
    await page.getByRole('button', { name: 'Filtrar' }).click();

    await expect(page.locator('body')).toContainText('Fallida');
  });
});
