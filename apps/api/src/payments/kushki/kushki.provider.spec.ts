import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KushkiProvider } from './kushki.provider.js';
import { PaymentStatus } from '../public-api.js';

const TEST_CONFIG = {
  KUSHKI_PRIVATE_KEY: 'kushki_private_test',
  KUSHKI_WEBHOOK_SECRET: 'kushki_webhook_secret',
};

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: async () => body as Record<string, unknown>,
  } as unknown as Response;
}

describe('KushkiProvider', () => {
  let provider: KushkiProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const module = await Test.createTestingModule({
      providers: [
        KushkiProvider,
        { provide: ConfigService, useValue: new ConfigService(TEST_CONFIG) },
      ],
    }).compile();

    provider = module.get(KushkiProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a charge and returns the transaction reference', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ transactionReference: 'kushki_txn_1' }),
    );

    const result = await provider.createPaymentIntent({
      orderId: 'order_1',
      orderNumber: 'ORD-001',
      amount: 1000,
      currency: 'USD',
      idempotencyKey: 'idem_1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.kushkipagos.com/card/v1/charges',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Private-Merchant-Id': 'kushki_private_test',
        }),
      }),
    );
    expect(result).toEqual({
      providerTransactionId: 'kushki_txn_1',
      clientSecret: '',
      status: PaymentStatus.PENDING,
    });
  });

  it('throws when Kushki rejects the charge', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ message: 'Invalid card' }, false),
    );

    await expect(
      provider.createPaymentIntent({
        orderId: 'order_2',
        orderNumber: 'ORD-002',
        amount: 500,
        currency: 'USD',
        idempotencyKey: 'idem_2',
      }),
    ).rejects.toThrow('Kushki charge failed: Invalid card');
  });

  it('builds a checkout session URL from the charge reference', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ transactionReference: 'kushki_txn_2' }),
    );

    const result = await provider.createCheckoutSession({
      orderId: 'order_3',
      orderNumber: 'ORD-003',
      amount: 1500,
      currency: 'USD',
    });

    expect(result.sessionId).toBe('kushki_txn_2');
    expect(result.url).toContain('kushki_txn_2');
  });

  it('maps approved webhook status to COMPLETED', async () => {
    const result = await provider.parseWebhookPayload({
      transactionReference: 'kushki_txn_1',
      status: 'approved',
    });

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(result.providerTransactionId).toBe('kushki_txn_1');
  });

  it('maps declined webhook status to FAILED', async () => {
    const result = await provider.parseWebhookPayload({
      transactionReference: 'kushki_txn_1',
      status: 'declined',
    });

    expect(result.status).toBe(PaymentStatus.FAILED);
  });

  it('validates signature with constant-time comparison', () => {
    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'kushki_webhook_secret',
        'kushki_webhook_secret',
      ),
    ).toBe(true);

    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'wrong',
        'kushki_webhook_secret',
      ),
    ).toBe(false);
  });
});
