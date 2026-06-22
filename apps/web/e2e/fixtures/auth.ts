import { Page, APIRequestContext } from '@playwright/test';

export interface TestUser {
  userId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FINANCE' | 'INVENTORY' | 'SUPPORT' | 'CUSTOMER';
}

export const TEST_CUSTOMER: TestUser = {
  userId: 'test_customer_user',
  role: 'CUSTOMER',
};

export const TEST_ADMIN: TestUser = {
  userId: 'test_admin_user',
  role: 'ADMIN',
};

export async function authenticatePage(page: Page, user: TestUser): Promise<void> {
  await page.request.post('/api/test/auth', {
    data: { userId: user.userId, role: user.role },
  });
  await page.goto('/');
}

export async function clearAuth(page: Page): Promise<void> {
  await page.request.delete('/api/test/auth');
}

export async function createTestOrder(
  request: APIRequestContext,
  overrides: {
    status?: 'DELIVERED' | 'PENDING' | 'PAYMENT_PENDING';
    customerEmail?: string;
    createdAt?: string;
  } = {},
): Promise<{ id: string; orderNumber: string }> {
  const now = new Date();
  const productRes = await request.post('http://localhost:3001/v1/products', {
    data: {
      name: `Test Product ${now.getTime()}`,
      slug: `test-product-${now.getTime()}`,
      sku: `TEST-${now.getTime()}`,
      status: 'ACTIVE',
      price: 49.99,
      variants: [{ sku: `TEST-${now.getTime()}-BLK`, name: 'Black', price: 49.99 }],
    },
    headers: { 'X-Test-Auth': encodeTestAuth(TEST_ADMIN) },
  });

  if (!productRes.ok()) {
    throw new Error(`Failed to create test product: ${await productRes.text()}`);
  }

  const product = (await productRes.json()) as { id: string; variants: Array<{ id: string }> };

  const inventoryRes = await request.post('http://localhost:3001/v1/inventory', {
    data: {
      productId: product.id,
      variantId: product.variants[0]?.id,
      quantity: 100,
      reservedQuantity: 0,
      lowStockThreshold: 10,
    },
    headers: { 'X-Test-Auth': encodeTestAuth(TEST_ADMIN) },
  });

  if (!inventoryRes.ok()) {
    throw new Error(`Failed to create test inventory: ${await inventoryRes.text()}`);
  }

  const orderRes = await request.post('http://localhost:3001/v1/orders', {
    data: {
      items: [{ productId: product.id, variantId: product.variants[0]?.id, quantity: 1, price: 49.99 }],
      customerEmail: overrides.customerEmail ?? 'customer@example.com',
      customerPhone: '+593999999999',
      channel: 'WEB',
    },
    headers: { 'X-Test-Auth': encodeTestAuth(TEST_ADMIN) },
  });

  if (!orderRes.ok()) {
    throw new Error(`Failed to create test order: ${await orderRes.text()}`);
  }

  const order = (await orderRes.json()) as { id: string; orderNumber: string };

  const targetStatus = overrides.status ?? 'DELIVERED';
  const statusRes = await request.patch(`http://localhost:3001/v1/orders/${order.id}/status`, {
    data: { status: targetStatus },
    headers: { 'X-Test-Auth': encodeTestAuth(TEST_ADMIN) },
  });

  if (!statusRes.ok()) {
    throw new Error(`Failed to update order status: ${await statusRes.text()}`);
  }

  return order;
}

export async function createCompletedPayment(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  const res = await request.post('http://localhost:3001/v1/test/payments', {
    data: { orderId },
    headers: { 'X-Test-Auth': encodeTestAuth(TEST_ADMIN) },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create test payment: ${await res.text()}`);
  }
}

export async function createReturnRequest(
  request: APIRequestContext,
  orderId: string,
  user: TestUser = TEST_CUSTOMER,
): Promise<{ id: string }> {
  const orderRes = await request.get(`http://localhost:3001/v1/orders/${orderId}`, {
    headers: { 'X-Test-Auth': encodeTestAuth(user) },
  });

  if (!orderRes.ok()) {
    throw new Error(`Failed to fetch test order: ${await orderRes.text()}`);
  }

  const order = (await orderRes.json()) as { items: Array<{ productId: string; variantId?: string | null; quantity: number }> };

  const res = await request.post(`http://localhost:3001/v1/orders/${orderId}/returns`, {
    data: {
      items: order.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
      })),
      reason: 'Defective item',
    },
    headers: { 'X-Test-Auth': encodeTestAuth(user) },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create return request: ${await res.text()}`);
  }

  return (await res.json()) as { id: string };
}

export async function transitionReturnStatus(
  request: APIRequestContext,
  returnId: string,
  status: string,
): Promise<void> {
  const res = await request.patch(`http://localhost:3001/v1/returns/${returnId}/status`, {
    data: { status },
    headers: { 'X-Test-Auth': encodeTestAuth(TEST_ADMIN) },
  });

  if (!res.ok()) {
    throw new Error(`Failed to update return status: ${await res.text()}`);
  }
}

export function encodeTestAuth(user: TestUser): string {
  return Buffer.from(JSON.stringify(user)).toString('base64url');
}
