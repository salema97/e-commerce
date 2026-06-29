import { test, expect } from '@playwright/test';
import {
  createTestProduct,
  createTestPromotion,
  presetCookieConsent,
} from './fixtures/auth.js';
import { E2E_API_BASE } from './fixtures/api-base.js';

test.describe('promotions checkout smoke', () => {
  test('admin-created coupon applies discount on order create', async ({ request }) => {
    const promo = await createTestPromotion(request, { value: 15 });
    const product = await createTestProduct(request);
    const price = 100;

    const orderRes = await request.post(`${E2E_API_BASE}/orders`, {
      data: {
        items: [
          {
            productId: product.id,
            variantId: product.variantId,
            quantity: 1,
            price,
          },
        ],
        customerEmail: 'guest-checkout@example.com',
        customerPhone: '+593999999999',
        channel: 'WEB',
        couponCode: promo.couponCode,
      },
    });

    if (!orderRes.ok()) {
      throw new Error(`Order create failed: ${await orderRes.text()}`);
    }

    const order = (await orderRes.json()) as {
      discountAmount: number;
      couponCode?: string;
      subtotal: number;
    };

    expect(order.couponCode).toBe(promo.couponCode);
    expect(order.discountAmount).toBe(15);
    expect(order.subtotal).toBe(price);
  });

  test('guest can apply coupon code in checkout UI', async ({ page, request }) => {
    const promo = await createTestPromotion(request);
    const product = await createTestProduct(request);

    await presetCookieConsent(page);
    await page.goto(`/store/${product.slug}`, { waitUntil: 'domcontentloaded' });

    const addButton = page.getByRole('button', { name: /agregar al carrito/i });
    await expect(addButton).toBeVisible({ timeout: 15_000 });
    await addButton.click();

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Código de cupón').fill(promo.couponCode);
    await page.getByRole('button', { name: 'Aplicar' }).click();

    await expect(page.getByText(`El cupón "${promo.couponCode}" se validará al finalizar la compra.`)).toBeVisible();
  });

  test('bundle coupon applies discount when all components are in cart', async ({ request }) => {
    const productA = await createTestProduct(request);
    const productB = await createTestProduct(request);
    const promo = await createTestPromotion(request, {
      type: 'BUNDLE',
      value: 10,
      rules: [
        { applicableProductId: productA.id, minimumQuantity: 1 },
        { applicableProductId: productB.id, minimumQuantity: 1 },
      ],
    });

    const orderRes = await request.post(`${E2E_API_BASE}/orders`, {
      data: {
        items: [
          { productId: productA.id, variantId: productA.variantId, quantity: 1, price: 40 },
          { productId: productB.id, variantId: productB.variantId, quantity: 1, price: 60 },
        ],
        customerEmail: 'bundle-checkout@example.com',
        customerPhone: '+593999999999',
        channel: 'WEB',
        couponCode: promo.couponCode,
      },
    });

    if (!orderRes.ok()) {
      throw new Error(`Bundle order create failed: ${await orderRes.text()}`);
    }

    const order = (await orderRes.json()) as { discountAmount: number; subtotal: number };
    expect(order.subtotal).toBe(100);
    expect(order.discountAmount).toBe(10);
  });

  test('tiered coupon applies highest matching tier', async ({ request }) => {
    const product = await createTestProduct(request);
    const promo = await createTestPromotion(request, {
      type: 'TIERED',
      value: 8,
      rules: [
        { minimumQuantity: 3, discountValue: 10 },
        { minimumQuantity: 5, discountValue: 15 },
      ],
    });

    const orderRes = await request.post(`${E2E_API_BASE}/orders`, {
      data: {
        items: [
          { productId: product.id, variantId: product.variantId, quantity: 5, price: 20 },
        ],
        customerEmail: 'tiered-checkout@example.com',
        customerPhone: '+593999999999',
        channel: 'WEB',
        couponCode: promo.couponCode,
      },
    });

    if (!orderRes.ok()) {
      throw new Error(`Tiered order create failed: ${await orderRes.text()}`);
    }

    const order = (await orderRes.json()) as { discountAmount: number; subtotal: number };
    expect(order.subtotal).toBe(100);
    expect(order.discountAmount).toBe(15);
  });
});
