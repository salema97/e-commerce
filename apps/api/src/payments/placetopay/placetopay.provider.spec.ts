import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PlaceToPayProvider } from './placetopay.provider.js';
import { PaymentStatus } from '../entities/payment-status.enum.js';

const TEST_CONFIG = {
  PLACETOPAY_LOGIN: 'ptp_login_test',
  PLACETOPAY_SECRET_KEY: 'ptp_secret_test',
  PLACETOPAY_BASE_URL: 'https://ptp.test',
};

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: async () => body as Record<string, unknown>,
  } as unknown as Response;
}

describe('PlaceToPayProvider', () => {
  let provider: PlaceToPayProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const module = await Test.createTestingModule({
      providers: [
        PlaceToPayProvider,
        { provide: ConfigService, useValue: new ConfigService(TEST_CONFIG) },
      ],
    }).compile();

    provider = module.get(PlaceToPayProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a session and returns the request id', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        requestId: 98765,
        processUrl: 'https://ptp.test/session/98765',
        status: { status: 'PENDING' },
      }),
    );

    const result = await provider.createPaymentIntent({
      orderId: 'order_1',
      orderNumber: 'ORD-001',
      amount: 1000,
      currency: 'USD',
      idempotencyKey: 'idem_1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://ptp.test/api/session',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({
      providerTransactionId: '98765',
      clientSecret: '',
      status: PaymentStatus.PENDING,
    });
  });

  it('throws when PlaceToPay rejects the session', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ message: 'Invalid auth' }, false),
    );

    await expect(
      provider.createPaymentIntent({
        orderId: 'order_2',
        orderNumber: 'ORD-002',
        amount: 500,
        currency: 'USD',
        idempotencyKey: 'idem_2',
      }),
    ).rejects.toThrow('PlaceToPay session failed: Invalid auth');
  });

  it('returns processUrl from the checkout session', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        requestId: 11111,
        processUrl: 'https://ptp.test/session/11111',
        status: { status: 'PENDING' },
      }),
    );

    const result = await provider.createCheckoutSession({
      orderId: 'order_3',
      orderNumber: 'ORD-003',
      amount: 1500,
      currency: 'USD',
    });

    expect(result.sessionId).toBe('11111');
    expect(result.url).toBe('https://ptp.test/session/11111');
  });

  it('maps approved webhook status to COMPLETED', async () => {
    const result = await provider.parseWebhookPayload({
      requestId: '98765',
      status: 'approved',
    });

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(result.providerTransactionId).toBe('98765');
  });

  it('maps rejected webhook status to FAILED', async () => {
    const result = await provider.parseWebhookPayload({
      requestId: '98765',
      status: 'rejected',
    });

    expect(result.status).toBe(PaymentStatus.FAILED);
  });

  it('validates signature with constant-time comparison', () => {
    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'ptp_secret_test',
        'ptp_secret_test',
      ),
    ).toBe(true);

    expect(
      provider.validateWebhookSignature(
        Buffer.from('{}'),
        'wrong',
        'ptp_secret_test',
      ),
    ).toBe(false);
  });
});
