import { Page, APIRequestContext } from '@playwright/test';

export type TestRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'FINANCE'
  | 'INVENTORY'
  | 'SUPPORT'
  | 'CUSTOMER';

export interface TestUser {
  role: TestRole;
}

export const TEST_SUPPORT: TestUser = { role: 'SUPPORT' };
export const TEST_CUSTOMER: TestUser = { role: 'CUSTOMER' };
export const TEST_ADMIN: TestUser = { role: 'ADMIN' };
export const TEST_FINANCE: TestUser = { role: 'FINANCE' };

const API_BASE = 'http://localhost:3001/v1';
const SEED_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'SeedDemo123!';

const SEED_EMAIL_BY_ROLE: Record<TestRole, string> = {
  SUPER_ADMIN: 'superadmin@example.com',
  ADMIN: 'store-admin@example.com',
  FINANCE: 'finance@example.com',
  INVENTORY: 'inventory@example.com',
  SUPPORT: 'support@example.com',
  CUSTOMER: 'cliente@example.com',
};

const LANDING_BY_ROLE: Record<TestRole, string> = {
  SUPER_ADMIN: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  FINANCE: '/admin/finance',
  INVENTORY: '/admin/inventory',
  SUPPORT: '/admin/support',
  CUSTOMER: '/account',
};

const apiTokenCache = new Map<TestRole, string>();

export async function presetCookieConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ecommerce-consent-v1',
      JSON.stringify({ necessary: true, analytics: true, recording: false }),
    );
  });
}

export async function dismissCookieBanner(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: 'Aceptar todo' });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

export async function getApiAuthHeaders(
  request: APIRequestContext,
  role: TestRole,
): Promise<Record<string, string>> {
  const cached = apiTokenCache.get(role);
  if (cached) {
    return { Authorization: `Bearer ${cached}` };
  }

  const email = SEED_EMAIL_BY_ROLE[role];
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password: SEED_PASSWORD },
  });

  if (!res.ok()) {
    throw new Error(`API login failed for ${email}: ${await res.text()}`);
  }

  const body = (await res.json()) as { tokens: { accessToken: string } };
  apiTokenCache.set(role, body.tokens.accessToken);
  return { Authorization: `Bearer ${body.tokens.accessToken}` };
}

export async function authenticatePage(page: Page, user: TestUser): Promise<void> {
  await presetCookieConsent(page);
  const email = SEED_EMAIL_BY_ROLE[user.role];
  const res = await page.request.post('/api/auth/login', {
    data: { email, password: SEED_PASSWORD },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${email}: ${await res.text()}`);
  }

  await page.goto(LANDING_BY_ROLE[user.role]);
  await dismissCookieBanner(page);
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 15_000 });
}

export async function clearAuth(page: Page): Promise<void> {
  await page.request.post('/api/auth/logout');
}

export async function createTestOrder(
  request: APIRequestContext,
  overrides: {
    status?: 'DELIVERED' | 'PENDING' | 'PAYMENT_PENDING';
    customerEmail?: string;
    createdAt?: string;
  } = {},
): Promise<{ id: string; orderNumber: string }> {
  const adminHeaders = await getApiAuthHeaders(request, 'ADMIN');
  const now = Date.now();
  const unique = `${now}-${Math.random().toString(36).slice(2, 9)}`;
  const productRes = await request.post(`${API_BASE}/products`, {
    data: {
      name: `Test Product ${unique}`,
      slug: `test-product-${unique}`,
      sku: `TEST-${unique}`,
      status: 'ACTIVE',
      price: 49.99,
      variants: [{ sku: `TEST-${unique}-BLK`, name: 'Black', price: 49.99 }],
    },
    headers: adminHeaders,
  });

  if (!productRes.ok()) {
    throw new Error(`Failed to create test product: ${await productRes.text()}`);
  }

  const product = (await productRes.json()) as { id: string; variants: Array<{ id: string }> };

  const inventoryRes = await request.post(`${API_BASE}/inventory`, {
    data: {
      productId: product.id,
      variantId: product.variants[0]?.id,
      quantity: 100,
      reservedQuantity: 0,
      lowStockThreshold: 10,
    },
    headers: adminHeaders,
  });

  if (!inventoryRes.ok()) {
    throw new Error(`Failed to create test inventory: ${await inventoryRes.text()}`);
  }

  const orderRes = await request.post(`${API_BASE}/orders`, {
    data: {
      items: [{ productId: product.id, variantId: product.variants[0]?.id, quantity: 1, price: 49.99 }],
      customerEmail: overrides.customerEmail ?? 'customer@example.com',
      customerPhone: '+593999999999',
      channel: 'WEB',
    },
    headers: adminHeaders,
  });

  if (!orderRes.ok()) {
    throw new Error(`Failed to create test order: ${await orderRes.text()}`);
  }

  const order = (await orderRes.json()) as { id: string; orderNumber: string };

  const targetStatus = overrides.status ?? 'DELIVERED';
  const statusRes = await request.patch(`${API_BASE}/orders/${order.id}/status`, {
    data: { status: targetStatus },
    headers: adminHeaders,
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
  const res = await request.post(`${API_BASE}/test/payments`, {
    data: { orderId },
    headers: await getApiAuthHeaders(request, 'ADMIN'),
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
  const userHeaders = await getApiAuthHeaders(request, user.role);

  const orderRes = await request.get(`${API_BASE}/orders/${orderId}`, {
    headers: userHeaders,
  });

  if (!orderRes.ok()) {
    throw new Error(`Failed to fetch test order: ${await orderRes.text()}`);
  }

  const order = (await orderRes.json()) as { items: Array<{ productId: string; variantId?: string | null; quantity: number }> };

  const res = await request.post(`${API_BASE}/orders/${orderId}/returns`, {
    data: {
      items: order.items.map((item) => ({
        productId: item.productId,
        productVariantId: item.variantId ?? undefined,
        quantity: item.quantity,
      })),
      reason: 'Defective item',
    },
    headers: userHeaders,
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
  const res = await request.patch(`${API_BASE}/returns/${returnId}/status`, {
    data: { status },
    headers: await getApiAuthHeaders(request, 'ADMIN'),
  });

  if (!res.ok()) {
    throw new Error(`Failed to update return status: ${await res.text()}`);
  }
}
