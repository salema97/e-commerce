import { APIRequestContext } from '@playwright/test';
import { encodeTestAuth, TEST_ADMIN } from './auth.js';

export async function createTestInvoice(
  request: APIRequestContext,
  orderId: string,
  overrides: {
    accessKey?: string;
    status?: string;
    authorizationNumber?: string | null;
  } = {},
): Promise<{ id: string; accessKey: string; status: string }> {
  const res = await request.post('http://localhost:3001/v1/test/invoices', {
    data: {
      orderId,
      accessKey: overrides.accessKey ?? `TEST-${Date.now()}`,
      status: overrides.status ?? 'DRAFT',
      authorizationNumber: overrides.authorizationNumber ?? null,
    },
    headers: { 'X-Test-Auth': encodeTestAuth(TEST_ADMIN) },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create test invoice: ${await res.text()}`);
  }

  return (await res.json()) as { id: string; accessKey: string; status: string };
}
