import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service.js';
import { StripeProvider } from './stripe.provider.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentStatus, RefundStatus } from '../entities/payment-status.enum.js';
import { OrderStatus } from '@prisma/client';
import { InvoicesService } from '../../invoices/invoices.service.js';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let stripeProvider: { validateWebhookSignature: ReturnType<typeof vi.fn> };
  let invoicesService: { issueInvoiceForOrder: ReturnType<typeof vi.fn> };
  let prisma: {
    payment: {
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    orderStatusHistory: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    stripeProvider = { validateWebhookSignature: vi.fn() };
    invoicesService = { issueInvoiceForOrder: vi.fn() };
    prisma = {
      payment: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      orderStatusHistory: { create: vi.fn() },
      $transaction: vi.fn(async (ops: unknown[]) => {
        for (const op of ops) {
          await op;
        }
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'whsec_xxx' },
        },
        { provide: StripeProvider, useValue: stripeProvider },
        { provide: PrismaService, useValue: prisma },
        { provide: InvoicesService, useValue: invoicesService },
      ],
    }).compile();

    service = module.get(StripeWebhookService);
  });

  it('rejects webhooks with invalid signature', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(false);

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'bad-signature'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('updates payment to COMPLETED on payment_intent.succeeded and records history', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_1',
      orderId: 'order_1',
      metadata: { clientSecret: 'secret' },
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.COMPLETED });

    await service.handleWebhook(
      Buffer.from(
        JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_123' } },
        }),
      ),
      'signature',
    );

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay_1' },
        data: expect.objectContaining({
          status: PaymentStatus.COMPLETED,
        }),
      }),
    );
    expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          orderId: 'order_1',
          status: OrderStatus.PROCESSING,
          notes: 'Payment confirmed via Stripe',
        },
      }),
    );
    expect(invoicesService.issueInvoiceForOrder).toHaveBeenCalledWith('order_1');
  });

  it('continues when invoice auto-issue fails on payment_intent.succeeded', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_1b',
      orderId: 'order_1b',
      metadata: {},
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.COMPLETED });
    invoicesService.issueInvoiceForOrder.mockRejectedValue(new Error('SRI unavailable'));

    await service.handleWebhook(
      Buffer.from(
        JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_123b' } },
        }),
      ),
      'signature',
    );

    expect(prisma.payment.update).toHaveBeenCalled();
    expect(invoicesService.issueInvoiceForOrder).toHaveBeenCalledWith('order_1b');
  });

  it('updates payment to FAILED on payment_intent.payment_failed', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_2',
      orderId: 'order_2',
      metadata: {},
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.FAILED });

    await service.handleWebhook(
      Buffer.from(
        JSON.stringify({
          type: 'payment_intent.payment_failed',
          data: {
            object: {
              id: 'pi_456',
              last_payment_error: { message: 'Card declined' },
            },
          },
        }),
      ),
      'signature',
    );

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay_2' },
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
      }),
    );
  });

  it('updates payment to REFUNDED on charge.refunded and records history', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_3',
      orderId: 'order_3',
      metadata: {},
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.REFUNDED });

    await service.handleWebhook(
      Buffer.from(
        JSON.stringify({
          type: 'charge.refunded',
          data: { object: { id: 'ch_123', payment_intent: 'pi_789' } },
        }),
      ),
      'signature',
    );

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay_3' },
        data: expect.objectContaining({
          status: PaymentStatus.REFUNDED,
        }),
      }),
    );
    expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          orderId: 'order_3',
          status: OrderStatus.REFUNDED,
          notes: 'Refund confirmed via Stripe',
        },
      }),
    );
  });

  it('logs and returns early when payment record is missing', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    prisma.payment.findFirst.mockResolvedValue(null);

    await service.handleWebhook(
      Buffer.from(
        JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_missing' } },
        }),
      ),
      'signature',
    );

    expect(prisma.payment.update).not.toHaveBeenCalled();
  });
});
