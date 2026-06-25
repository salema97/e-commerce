import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoProvider } from './mercadopago.provider.js';
import { PaymentStatus } from '../public-api.js';

const TEST_CONFIG = {
  MERCADOPAGO_ACCESS_TOKEN: 'mp_token_test',
  MERCADOPAGO_WEBHOOK_SECRET: 'mp_webhook_secret',
};

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: async () => body as Record<string, unknown>,
  } as unknown as Response;
}

describe('MercadoPagoProvider', () => {
  let provider: MercadoPagoProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const module = await Test.createTestingModule({
      providers: [
        MercadoPagoProvider,
        { provide: ConfigService, useValue: new ConfigService(TEST_CONFIG) },
      ],
    }).compile();

    provider = module.get(MercadoPagoProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a payment with idempotency header', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: 12345 }));

    const result = await provider.createPaymentIntent({
      orderId: 'order_1',
      orderNumber: 'ORD-001',
      amount: 1000,
      currency: 'USD',
      idempotencyKey: 'idem_1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mercadopago.com/v1/payments',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mp_token_test',
          'X-Idempotency-Key': 'idem_1',
        }),
      }),
    );
    expect(result).toEqual({
      providerTransactionId: '12345',
      clientSecret: '',
      status: PaymentStatus.PENDING,
    });
  });

  it('throws when MercadoPago rejects the payment', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ message: 'Invalid access token' }, false),
    );

    await expect(
      provider.createPaymentIntent({
        orderId: 'order_2',
        orderNumber: 'ORD-002',
        amount: 500,
        currency: 'USD',
        idempotencyKey: 'idem_2',
      }),
    ).rejects.toThrow('MercadoPago payment failed: Invalid access token');
  });

  it('creates a checkout preference and returns init_point URL', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        id: 'pref_1',
        init_point: 'https://mercadopago.com/checkout/pref_1',
      }),
    );

    const result = await provider.createCheckoutSession({
      orderId: 'order_3',
      orderNumber: 'ORD-003',
      amount: 1500,
      currency: 'USD',
    });

    expect(result.sessionId).toBe('pref_1');
    expect(result.url).toBe('https://mercadopago.com/checkout/pref_1');
  });

  it('maps payment.updated webhook to COMPLETED', async () => {
    const result = await provider.parseWebhookPayload({
      data_id: '12345',
      type: 'payment.updated',
    });

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(result.providerTransactionId).toBe('12345');
  });

  it('validates signature with constant-time comparison', () => {
    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'mp_webhook_secret',
        'mp_webhook_secret',
      ),
    ).toBe(true);

    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'wrong',
        'mp_webhook_secret',
      ),
    ).toBe(false);
  });
});
