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

    await expect(page.locator('body')).toContainText('Facturación', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(invoice.accessKey.slice(0, 20), {
      timeout: 15_000,
    });

    const row = page.getByRole('row').filter({ hasText: invoice.accessKey.slice(0, 20) });
    await row.getByRole('button', { name: 'Acciones de factura' }).click();
    await page.getByRole('menuitem', { name: 'Ver detalle' }).click();
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

    await expect(page.locator('body')).toContainText('falló', { timeout: 15_000 });

    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page).toHaveURL(`/admin/invoices/${invoice.id}`, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(invoice.accessKey, { timeout: 15_000 });
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

    const statusFilter = page.getByRole('combobox', { name: 'Filtrar por estado' });
    await statusFilter.click();
    await page.getByRole('option', { name: 'Fallida' }).click({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Filtrar' }).click();

    await expect(page.locator('body')).toContainText('Fallida');
  });
});
