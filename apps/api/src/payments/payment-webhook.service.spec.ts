import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, OrderStatus } from '@prisma/client';
import { PaymentWebhookService } from './payment-webhook.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';
import { EmailNotificationService } from '../notifications/email-notification.service.js';
import { PushNotificationService } from '../notifications/push-notification.service.js';
import { MarketingAutomationService } from '../notifications/marketing-automation.service.js';
import { OrderSummaryPdfService } from '../receipts/order-summary-pdf.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';

describe('PaymentWebhookService', () => {
  let service: PaymentWebhookService;
  let factory: {
    getProvider: ReturnType<typeof vi.fn>;
  };
  let provider: {
    validateWebhookSignature: ReturnType<typeof vi.fn>;
    parseWebhookPayload: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    payment: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    order: { update: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
    orderStatusHistory: { create: ReturnType<typeof vi.fn> };
  };
  let notificationService: { notify: ReturnType<typeof vi.fn> };
  let emailNotificationService: { notify: ReturnType<typeof vi.fn> };
  let pushNotificationService: { notifyForOrder: ReturnType<typeof vi.fn> };
  let invoicesService: { enqueueInvoiceForOrder: ReturnType<typeof vi.fn> };
  let marketingAutomation: { trackPurchaseEvent: ReturnType<typeof vi.fn> };
  let orderSummaryPdf: { buildEmailAttachment: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    provider = {
      validateWebhookSignature: vi.fn(() => true),
      parseWebhookPayload: vi.fn(),
    };
    factory = { getProvider: vi.fn(() => provider) };
    prisma = {
      payment: { findFirst: vi.fn(), update: vi.fn() },
      order: { update: vi.fn(), findUnique: vi.fn() },
      orderStatusHistory: { create: vi.fn() },
    };
    notificationService = { notify: vi.fn().mockResolvedValue(undefined) };
    emailNotificationService = { notify: vi.fn().mockResolvedValue(undefined) };
    pushNotificationService = { notifyForOrder: vi.fn().mockResolvedValue(undefined) };
    invoicesService = { enqueueInvoiceForOrder: vi.fn().mockResolvedValue(undefined) };
    marketingAutomation = { trackPurchaseEvent: vi.fn().mockResolvedValue(undefined) };
    orderSummaryPdf = {
      buildEmailAttachment: vi.fn().mockResolvedValue({
        filename: 'pedido-ORD-1.pdf',
        content: Buffer.from('pdf'),
        contentType: 'application/pdf',
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentWebhookService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'KUSHKI_WEBHOOK_SECRET') return 'kushki_secret';
              if (key === 'PAYPHONE_TOKEN') return 'pp_token';
              if (key === 'MERCADOPAGO_WEBHOOK_SECRET') return 'mp_secret';
              if (key === 'PLACETOPAY_SECRET_KEY') return 'ptp_secret';
              return '';
            },
          },
        },
        { provide: PaymentProviderFactory, useValue: factory },
        { provide: PrismaService, useValue: prisma },
        { provide: WhatsAppNotificationService, useValue: notificationService },
        { provide: EmailNotificationService, useValue: emailNotificationService },
        { provide: PushNotificationService, useValue: pushNotificationService },
        { provide: InvoicesService, useValue: invoicesService },
        { provide: MarketingAutomationService, useValue: marketingAutomation },
        { provide: OrderSummaryPdfService, useValue: orderSummaryPdf },
      ],
    }).compile();

    service = module.get(PaymentWebhookService);
  });

  it('rejects unknown provider names', async () => {
    await expect(
      service.handle('unknown', Buffer.from('{}'), 'sig'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid webhook signatures', async () => {
    provider.validateWebhookSignature.mockReturnValueOnce(false);

    await expect(
      service.handle('kushki', Buffer.from(JSON.stringify({ foo: 'bar' })), 'bad-signature'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('completes payment and transitions order to PROCESSING on COMPLETED webhook', async () => {
    provider.parseWebhookPayload.mockResolvedValueOnce({
      status: PaymentStatus.COMPLETED,
      providerTransactionId: 'kushki_txn_1',
      metadata: { event: 'approved' },
    });
    prisma.payment.findFirst.mockResolvedValueOnce({
      id: 'pay_1',
      orderId: 'order_1',
      status: PaymentStatus.PENDING,
    });

    const result = await service.handle(
      'kushki',
      Buffer.from(JSON.stringify({ transactionReference: 'kushki_txn_1', status: 'approved' })),
      'kushki_secret',
    );

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay_1' },
        data: expect.objectContaining({ status: PaymentStatus.COMPLETED }),
      }),
    );
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order_1' },
        data: { status: OrderStatus.PROCESSING },
      }),
    );
    expect(prisma.orderStatusHistory.create).toHaveBeenCalled();
    expect(invoicesService.enqueueInvoiceForOrder).toHaveBeenCalledWith('order_1');
  });

  it('continues webhook handling when invoice enqueue fails', async () => {
    provider.parseWebhookPayload.mockResolvedValueOnce({
      status: PaymentStatus.COMPLETED,
      providerTransactionId: 'kushki_txn_1',
      metadata: { event: 'approved' },
    });
    prisma.payment.findFirst.mockResolvedValueOnce({
      id: 'pay_1',
      orderId: 'order_1',
      status: PaymentStatus.PENDING,
    });
    invoicesService.enqueueInvoiceForOrder.mockRejectedValue(new Error('Queue down'));

    const result = await service.handle(
      'kushki',
      Buffer.from(JSON.stringify({ transactionReference: 'kushki_txn_1', status: 'approved' })),
      'kushki_secret',
    );

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order_1' },
        data: { status: OrderStatus.PROCESSING },
      }),
    );
    expect(invoicesService.enqueueInvoiceForOrder).toHaveBeenCalledWith('order_1');
  });

  it('transitions order to PAYMENT_FAILED on FAILED webhook', async () => {
    provider.parseWebhookPayload.mockResolvedValueOnce({
      status: PaymentStatus.FAILED,
      providerTransactionId: 'pp_txn_1',
      metadata: { event: 'declined' },
    });
    prisma.payment.findFirst.mockResolvedValueOnce({
      id: 'pay_2',
      orderId: 'order_2',
      status: PaymentStatus.PENDING,
    });
    prisma.order.findUnique.mockResolvedValueOnce({
      id: 'order_2',
      customerPhone: '+593991234567',
      orderNumber: 'ORD-002',
      total: 99.99,
      user: { whatsappOptOut: false },
    });

    const result = await service.handle(
      'payphone',
      Buffer.from(JSON.stringify({ id: 'pp_txn_1', transactionStatus: -1 })),
      'pp_token',
    );

    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: OrderStatus.PAYMENT_FAILED },
      }),
    );
    expect(notificationService.notify).toHaveBeenCalledWith(
      'order_2',
      'PAYMENT_FAILED',
      '+593991234567',
      expect.objectContaining({ orderNumber: 'ORD-002' }),
    );
    expect(invoicesService.enqueueInvoiceForOrder).not.toHaveBeenCalled();
  });

  it('completes webhook handling even if WhatsApp notification rejects', async () => {
    provider.parseWebhookPayload.mockResolvedValueOnce({
      status: PaymentStatus.COMPLETED,
      providerTransactionId: 'kushki_txn_1',
      metadata: { event: 'approved' },
    });
    prisma.payment.findFirst.mockResolvedValueOnce({
      id: 'pay_1',
      orderId: 'order_1',
      status: PaymentStatus.PENDING,
    });
    prisma.order.findUnique.mockResolvedValueOnce({
      id: 'order_1',
      customerPhone: '+593991234567',
      orderNumber: 'ORD-001',
      total: 100,
      user: { whatsappOptOut: false },
    });
    notificationService.notify.mockRejectedValue(new Error('WhatsApp down'));

    const result = await service.handle(
      'kushki',
      Buffer.from(JSON.stringify({ transactionReference: 'kushki_txn_1', status: 'approved' })),
      'kushki_secret',
    );

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: OrderStatus.PROCESSING },
      }),
    );
  });

  it('skips persistence when payment record is not found', async () => {
    provider.parseWebhookPayload.mockResolvedValueOnce({
      status: PaymentStatus.COMPLETED,
      providerTransactionId: 'mp_1',
      metadata: {},
    });
    prisma.payment.findFirst.mockResolvedValueOnce(null);

    const result = await service.handle(
      'mercadopago',
      Buffer.from(JSON.stringify({ data_id: 'mp_1', type: 'payment.updated' })),
      'mp_secret',
    );

    expect(result.providerTransactionId).toBe('mp_1');
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('routes placetopay provider to the configured secret', async () => {
    provider.parseWebhookPayload.mockResolvedValueOnce({
      status: PaymentStatus.PENDING,
      providerTransactionId: 'ptp_1',
      metadata: {},
    });

    await service.handle('placetopay', Buffer.from(JSON.stringify({ requestId: 'ptp_1' })), 'ptp_secret');

    expect(factory.getProvider).toHaveBeenCalledWith(PaymentProvider.PLACETOPAY);
    expect(provider.validateWebhookSignature).toHaveBeenCalled();
  });
});
