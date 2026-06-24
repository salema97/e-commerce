import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service.js';
import { StripeProvider } from './stripe.provider.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentStatus } from '../entities/payment-status.enum.js';
import { OrderStatus } from '@prisma/client';
import { SriQueueService } from '../../invoices/sri/sri-queue.service.js';
import { InventoryReservationService } from '../../inventory/inventory-reservation.service.js';
import { AuditLogService } from '../../audit/audit-log.service.js';
import { EventBus } from '../../event-bus/event-bus.interface.js';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let stripeProvider: { validateWebhookSignature: ReturnType<typeof vi.fn> };
  let sriQueue: { addIssueInvoiceJob: ReturnType<typeof vi.fn> };
  let reservationService: { confirm: ReturnType<typeof vi.fn> };
  let auditLogService: { log: ReturnType<typeof vi.fn> };
  let prisma: {
    payment: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    order: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    orderStatusHistory: { create: ReturnType<typeof vi.fn> };
    auditLog: { findFirst: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    stripeProvider = { validateWebhookSignature: vi.fn() };
    sriQueue = { addIssueInvoiceJob: vi.fn().mockResolvedValue({ id: 'job_1' }) };
    reservationService = { confirm: vi.fn() };
    auditLogService = { log: vi.fn() };

    const tx = {
      payment: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
      },
      order: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
    };

    prisma = {
      ...tx,
      auditLog: { findFirst: vi.fn() },
      $transaction: vi.fn((cb) => {
        if (typeof cb === 'function') {
          return cb(tx);
        }
        return Promise.all(cb.map((op: unknown) => op));
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
        { provide: SriQueueService, useValue: sriQueue },
        { provide: InventoryReservationService, useValue: reservationService },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: EventBus, useValue: { publish: vi.fn(), registerHandler: vi.fn() } },
      ],
    }).compile();

    service = module.get(StripeWebhookService);
  });

  function buildWebhookPayload(type: string, object: Record<string, unknown>, eventId = 'evt_1') {
    return Buffer.from(JSON.stringify({ id: eventId, type, data: { object } }));
  }

  it('rejects webhooks with invalid signature', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(false);

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'bad-signature'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('skips already processed events', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    prisma.auditLog.findFirst.mockResolvedValue({ id: 'log_1' });

    await service.handleWebhook(
      buildWebhookPayload('payment_intent.succeeded', { id: 'pi_123' }, 'evt_duplicate'),
      'signature',
    );

    expect(prisma.payment.findFirst).not.toHaveBeenCalled();
  });

  it('updates payment, order, inventory and audit on payment_intent.succeeded', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_1',
      orderId: 'order_1',
      status: PaymentStatus.PENDING,
      metadata: { clientSecret: 'secret' },
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.findUnique.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.COMPLETED });
    prisma.order.update.mockResolvedValue({ id: 'order_1', status: OrderStatus.PROCESSING });

    await service.handleWebhook(
      buildWebhookPayload('payment_intent.succeeded', { id: 'pi_123' }),
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
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order_1' },
        data: { status: OrderStatus.PROCESSING },
      }),
    );
    expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          orderId: 'order_1',
          status: OrderStatus.PROCESSING,
          notes: 'Payment confirmed via Stripe (payment_intent.succeeded)',
        },
      }),
    );
    expect(reservationService.confirm).toHaveBeenCalledWith('order_1');
    expect(auditLogService.log).toHaveBeenCalled();
    expect(sriQueue.addIssueInvoiceJob).toHaveBeenCalledWith('order_1');
  });

  it('creates payment record and confirms order on checkout.session.completed', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 'order_2',
      total: 99.99,
    });
    prisma.payment.create.mockResolvedValue({
      id: 'pay_2',
      orderId: 'order_2',
      status: PaymentStatus.PENDING,
    });
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay_2',
      orderId: 'order_2',
      status: PaymentStatus.PENDING,
      metadata: {},
    });

    await service.handleWebhook(
      buildWebhookPayload('checkout.session.completed', {
        id: 'cs_123',
        payment_intent: 'pi_456',
        amount_total: 9999,
        currency: 'usd',
        metadata: { orderId: 'order_2' },
      }),
      'signature',
    );

    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order_2',
          providerTransactionId: 'pi_456',
          checkoutSessionId: 'cs_123',
          amount: 99.99,
          currency: 'USD',
        }),
      }),
    );
    expect(reservationService.confirm).toHaveBeenCalledWith('order_2');
    expect(sriQueue.addIssueInvoiceJob).toHaveBeenCalledWith('order_2');
  });

  it('continues when invoice enqueue fails on payment_intent.succeeded', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_1b',
      orderId: 'order_1b',
      status: PaymentStatus.PENDING,
      metadata: {},
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.findUnique.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.COMPLETED });
    sriQueue.addIssueInvoiceJob.mockRejectedValue(new Error('Queue unavailable'));

    await service.handleWebhook(
      buildWebhookPayload('payment_intent.succeeded', { id: 'pi_123b' }),
      'signature',
    );

    expect(prisma.payment.update).toHaveBeenCalled();
    expect(sriQueue.addIssueInvoiceJob).toHaveBeenCalledWith('order_1b');
  });

  it('updates payment and order to FAILED on payment_intent.payment_failed', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_2',
      orderId: 'order_2',
      status: PaymentStatus.PENDING,
      metadata: {},
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.FAILED });

    await service.handleWebhook(
      buildWebhookPayload('payment_intent.payment_failed', {
        id: 'pi_456',
        last_payment_error: { message: 'Card declined' },
      }),
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
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order_2' },
        data: { status: OrderStatus.PAYMENT_FAILED },
      }),
    );
  });

  it('updates payment and order to REFUNDED on charge.refunded', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    const payment = {
      id: 'pay_3',
      orderId: 'order_3',
      status: PaymentStatus.COMPLETED,
      metadata: {},
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.payment.update.mockResolvedValue({ ...payment, status: PaymentStatus.REFUNDED });

    await service.handleWebhook(
      buildWebhookPayload('charge.refunded', { id: 'ch_123', payment_intent: 'pi_789' }),
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
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order_3' },
        data: { status: OrderStatus.REFUNDED },
      }),
    );
  });

  it('logs and returns early when payment record is missing for payment_intent.succeeded', async () => {
    stripeProvider.validateWebhookSignature.mockReturnValue(true);
    prisma.payment.findFirst.mockResolvedValue(null);

    await service.handleWebhook(
      buildWebhookPayload('payment_intent.succeeded', { id: 'pi_missing' }),
      'signature',
    );

    expect(prisma.payment.update).not.toHaveBeenCalled();
  });
});
