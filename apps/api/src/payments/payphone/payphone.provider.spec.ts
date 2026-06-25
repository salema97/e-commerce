import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PayPhoneProvider } from './payphone.provider.js';
import { PaymentStatus } from '../public-api.js';

const TEST_CONFIG = {
  PAYPHONE_TOKEN: 'payphone_token_test',
  PAYPHONE_STORE_ID: 'payphone_store_test',
};

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: async () => body as Record<string, unknown>,
  } as unknown as Response;
}

describe('PayPhoneProvider', () => {
  let provider: PayPhoneProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const module = await Test.createTestingModule({
      providers: [
        PayPhoneProvider,
        { provide: ConfigService, useValue: new ConfigService(TEST_CONFIG) },
      ],
    }).compile();

    provider = module.get(PayPhoneProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a transaction with the store id and bearer token', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ transactionId: 'pp_txn_1' }),
    );

    const result = await provider.createPaymentIntent({
      orderId: 'order_1',
      orderNumber: 'ORD-001',
      amount: 1000,
      currency: 'USD',
      idempotencyKey: 'idem_1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://payphone.app/api/transaction/create',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer payphone_token_test',
        }),
      }),
    );
    expect(result).toEqual({
      providerTransactionId: 'pp_txn_1',
      clientSecret: '',
      status: PaymentStatus.PENDING,
    });
  });

  it('throws when PayPhone rejects the transaction', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ message: 'Store not found' }, false),
    );

    await expect(
      provider.createPaymentIntent({
        orderId: 'order_2',
        orderNumber: 'ORD-002',
        amount: 500,
        currency: 'USD',
        idempotencyKey: 'idem_2',
      }),
    ).rejects.toThrow('PayPhone transaction failed: Store not found');
  });

  it('maps transactionStatus 1 to COMPLETED', async () => {
    const result = await provider.parseWebhookPayload({
      id: 'pp_txn_1',
      transactionStatus: 1,
    });

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(result.providerTransactionId).toBe('pp_txn_1');
  });

  it('maps transactionStatus -1 to FAILED', async () => {
    const result = await provider.parseWebhookPayload({
      id: 'pp_txn_2',
      transactionStatus: -1,
    });

    expect(result.status).toBe(PaymentStatus.FAILED);
  });

  it('validates signature with constant-time comparison', () => {
    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'payphone_token_test',
        'payphone_token_test',
      ),
    ).toBe(true);

    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'wrong',
        'payphone_token_test',
      ),
    ).toBe(false);
  });
});
