import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeProvider } from './stripe.provider.js';
import { PaymentStatus, RefundStatus } from '../entities/payment-status.enum.js';

function createStripeMock() {
  return {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
}

describe('StripeProvider', () => {
  let provider: StripeProvider;
  let stripeMock: ReturnType<typeof createStripeMock>;

  beforeEach(async () => {
    stripeMock = createStripeMock();

    const module = await Test.createTestingModule({
      providers: [
        StripeProvider,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'sk_test_xxx' },
        },
      ],
    }).compile();

    provider = module.get(StripeProvider);
    (provider as unknown as { stripe: typeof stripeMock }).stripe = stripeMock;
  });

  it('creates a PaymentIntent with idempotency key', async () => {
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'pi_123_secret',
      status: 'requires_action',
    });

    const result = await provider.createPaymentIntent({
      orderId: 'order_1',
      orderNumber: 'ORD-001',
      amount: 1000,
      currency: 'USD',
      idempotencyKey: 'idem_123',
    });

    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        currency: 'usd',
        metadata: {
          orderId: 'order_1',
          orderNumber: 'ORD-001',
        },
      }),
      { idempotencyKey: 'idem_123' },
    );

    expect(result).toEqual({
      providerTransactionId: 'pi_123',
      clientSecret: 'pi_123_secret',
      status: PaymentStatus.PENDING,
    });
  });

  it('passes customer email and metadata when creating PaymentIntent', async () => {
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: 'pi_456',
      client_secret: 'pi_456_secret',
      status: 'requires_payment_method',
    });

    await provider.createPaymentIntent({
      orderId: 'order_2',
      orderNumber: 'ORD-002',
      amount: 2500,
      currency: 'EUR',
      customerEmail: 'customer@example.com',
      metadata: { customKey: 'customValue' },
      idempotencyKey: 'idem_456',
    });

    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2500,
        currency: 'eur',
        receipt_email: 'customer@example.com',
        metadata: {
          orderId: 'order_2',
          orderNumber: 'ORD-002',
          customKey: 'customValue',
        },
      }),
      { idempotencyKey: 'idem_456' },
    );
  });

  it('confirms a PaymentIntent status', async () => {
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_123',
      status: 'succeeded',
    });

    const result = await provider.confirmPayment('pi_123');

    expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
    expect(result).toEqual({
      providerTransactionId: 'pi_123',
      status: PaymentStatus.COMPLETED,
    });
  });

  it('maps canceled PaymentIntent to FAILED', async () => {
    stripeMock.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_789',
      status: 'canceled',
    });

    const result = await provider.confirmPayment('pi_789');

    expect(result.status).toBe(PaymentStatus.FAILED);
  });

  it('creates a refund with optional amount', async () => {
    stripeMock.refunds.create.mockResolvedValue({
      id: 're_123',
      status: 'succeeded',
    });

    const result = await provider.refund('pi_123', 500);

    expect(stripeMock.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_123',
      amount: 500,
    });
    expect(result).toEqual({
      providerRefundId: 're_123',
      status: RefundStatus.COMPLETED,
    });
  });

  it('creates a full refund when amount is omitted', async () => {
    stripeMock.refunds.create.mockResolvedValue({
      id: 're_456',
      status: 'pending',
    });

    await provider.refund('pi_456');

    expect(stripeMock.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_456',
      amount: undefined,
    });
  });

  it('returns true for valid webhook signature', () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({ type: 'payment_intent.succeeded' });

    const result = provider.validateWebhookSignature(
      Buffer.from('{}'),
      'signature',
      'whsec_xxx',
    );

    expect(result).toBe(true);
  });

  it('returns false for invalid webhook signature', () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const result = provider.validateWebhookSignature(
      Buffer.from('{}'),
      'bad-signature',
      'whsec_xxx',
    );

    expect(result).toBe(false);
  });
});
