import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { PaymentsService } from './payments.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProvider as PaymentProviderEnum } from './payment-provider.enum.js';
import { PaymentStatus } from './entities/payment-status.enum.js';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let providerFactory: { getProvider: ReturnType<typeof vi.fn> };
  let provider: {
    createPaymentIntent: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    payment: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    provider = { createPaymentIntent: vi.fn() };
    providerFactory = { getProvider: vi.fn(() => provider) };
    prisma = {
      payment: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentProviderFactory, useValue: providerFactory },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('creates a new payment intent and persists the payment', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    provider.createPaymentIntent.mockResolvedValue({
      providerTransactionId: 'pi_123',
      clientSecret: 'pi_123_secret',
      status: PaymentStatus.PENDING,
    });
    prisma.payment.create.mockResolvedValue({
      id: 'pay_1',
      providerTransactionId: 'pi_123',
      status: PaymentStatus.PENDING,
      metadata: { clientSecret: 'pi_123_secret' },
    });

    const result = await service.createPaymentIntent({
      orderId: 'order_1',
      orderNumber: 'ORD-001',
      amount: 1000,
      provider: PaymentProviderEnum.STRIPE,
      idempotencyKey: 'idem_123',
    });

    expect(providerFactory.getProvider).toHaveBeenCalledWith(PaymentProviderEnum.STRIPE);
    expect(provider.createPaymentIntent).toHaveBeenCalled();
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order_1',
          provider: PaymentProviderEnum.STRIPE,
          providerTransactionId: 'pi_123',
          idempotencyKey: 'idem_123',
          amount: 10,
          currency: 'USD',
          status: PaymentStatus.PENDING,
        }),
      }),
    );
    expect(result.paymentId).toBe('pay_1');
    expect(result.idempotencyKey).toBe('idem_123');
  });

  it('returns existing payment when idempotency key is reused within 24h', async () => {
    const existing = {
      id: 'pay_existing',
      providerTransactionId: 'pi_existing',
      status: PaymentStatus.PENDING,
      metadata: { clientSecret: 'existing_secret', idempotencyKey: 'idem_reuse' },
      createdAt: new Date(),
    };
    prisma.payment.findFirst.mockResolvedValue(existing);

    const result = await service.createPaymentIntent({
      orderId: 'order_2',
      orderNumber: 'ORD-002',
      amount: 2000,
      provider: PaymentProviderEnum.STRIPE,
      idempotencyKey: 'idem_reuse',
    });

    expect(provider.createPaymentIntent).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      paymentId: 'pay_existing',
      providerTransactionId: 'pi_existing',
      clientSecret: 'existing_secret',
      status: PaymentStatus.PENDING,
      idempotencyKey: 'idem_reuse',
    });
  });

  it('generates an idempotency key when none is provided', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    provider.createPaymentIntent.mockResolvedValue({
      providerTransactionId: 'pi_789',
      clientSecret: 'pi_789_secret',
      status: PaymentStatus.PENDING,
    });
    prisma.payment.create.mockResolvedValue({
      id: 'pay_789',
      providerTransactionId: 'pi_789',
      status: PaymentStatus.PENDING,
    });

    const result = await service.createPaymentIntent({
      orderId: 'order_3',
      orderNumber: 'ORD-003',
      amount: 500,
      provider: PaymentProviderEnum.STRIPE,
    });

    expect(result.idempotencyKey).toBeDefined();
    expect(result.idempotencyKey.length).toBeGreaterThan(0);
  });
});
