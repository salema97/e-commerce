import { APIRequestContext } from '@playwright/test';
import { getApiAuthHeaders } from './auth.js';
import { E2E_API_BASE } from './api-base.js';

export async function createTestInvoice(
  request: APIRequestContext,
  orderId: string,
  overrides: {
    accessKey?: string;
    status?: string;
    authorizationNumber?: string | null;
  } = {},
): Promise<{ id: string; accessKey: string; status: string }> {
  const res = await request.post(`${E2E_API_BASE}/test/invoices`, {
    data: {
      orderId,
      accessKey: overrides.accessKey ?? `TEST-${crypto.randomUUID()}`,
      status: overrides.status ?? 'DRAFT',
      authorizationNumber: overrides.authorizationNumber ?? null,
    },
    headers: await getApiAuthHeaders(request, 'ADMIN'),
  });

  if (!res.ok()) {
    throw new Error(`Failed to create test invoice: ${await res.text()}`);
  }

  return (await res.json()) as { id: string; accessKey: string; status: string };
}
