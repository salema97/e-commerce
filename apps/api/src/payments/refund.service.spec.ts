import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, OrderStatus, PaymentStatus, RefundStatus, PaymentProvider, PromotionType } from '@prisma/client';
import { RefundService } from './refund.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { InvoiceProviderFactory } from '../invoices/invoice-provider.factory.js';
import { AuditLogService } from '../audit/audit-log.service.js';

describe('RefundService', () => {
  let service: RefundService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let providerFactory: { getProvider: ReturnType<typeof vi.fn> };
  let provider: { refund: ReturnType<typeof vi.fn> };
  let invoiceProviderFactory: { getProvider: ReturnType<typeof vi.fn> };
  let invoiceProvider: { issueCreditNote: ReturnType<typeof vi.fn> };
  let auditLog: { log: ReturnType<typeof vi.fn> };

  function buildPrismaMock() {
    return {
      order: { findUnique: vi.fn(), update: vi.fn() },
      payment: { update: vi.fn() },
      refund: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    };
  }

  beforeEach(async () => {
    prisma = buildPrismaMock();
    provider = { refund: vi.fn() };
    providerFactory = { getProvider: vi.fn(() => provider) };
    invoiceProvider = { issueCreditNote: vi.fn().mockResolvedValue({}) };
    invoiceProviderFactory = { getProvider: vi.fn(() => invoiceProvider) };
    auditLog = { log: vi.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        RefundService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentProviderFactory, useValue: providerFactory },
        { provide: InvoiceProviderFactory, useValue: invoiceProviderFactory },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();
    service = module.get(RefundService);
  });

  function buildOrder(overrides: Partial<{
    total: Prisma.Decimal;
    payments: Array<{ id: string; provider: PaymentProvider; status: PaymentStatus; amount: Prisma.Decimal; providerTransactionId: string | null }>;
    invoice: { accessKey: string } | null;
  }> = {}) {
    const total = overrides.total ?? new Prisma.Decimal(100);
    const payments = overrides.payments ?? [
      { id: 'pay1', provider: PaymentProvider.STRIPE, status: PaymentStatus.COMPLETED, amount: new Prisma.Decimal(100), providerTransactionId: 'pi_1' },
    ];
    const invoice = overrides.invoice !== undefined ? overrides.invoice : { accessKey: 'accesskey'.padEnd(49, '0') };
    return {
      id: 'o1',
      total,
      payments,
      invoice,
    };
  }

  describe('createRefund', () => {
    it('creates a full refund and marks order REFUNDED', async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrder());
      provider.refund.mockResolvedValue({ providerRefundId: 're_1', status: RefundStatus.COMPLETED });
      prisma.refund.create.mockResolvedValue({
        id: 'r1', orderId: 'o1', paymentId: 'pay1', providerRefundId: 're_1',
        amount: new Prisma.Decimal(100), reason: 'full refund', status: RefundStatus.COMPLETED,
        requestedById: 'admin1', approvedById: null,
        providerMetadata: { type: 'full' }, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createRefund({ orderId: 'o1', amount: 100, type: 'full', requestedById: 'admin1' });

      expect(provider.refund).toHaveBeenCalledWith('pi_1', 100);
      expect(prisma.refund.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'o1', paymentId: 'pay1', amount: new Prisma.Decimal(100),
        }),
      }));
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.REFUNDED }),
      }));
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(invoiceProvider.issueCreditNote).toHaveBeenCalled();
      expect(auditLog.log).toHaveBeenCalled();
      expect(result.type).toBe('full');
      expect(result.status).toBe(RefundStatus.COMPLETED);
    });

    it('creates a partial refund and marks order PARTIALLY_REFUNDED without flipping payment status', async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrder());
      provider.refund.mockResolvedValue({ providerRefundId: 're_2', status: RefundStatus.PENDING });
      prisma.refund.create.mockResolvedValue({
        id: 'r2', orderId: 'o1', paymentId: 'pay1', providerRefundId: 're_2',
        amount: new Prisma.Decimal(30), reason: 'partial refund', status: RefundStatus.PENDING,
        requestedById: 'admin1', approvedById: null,
        providerMetadata: { type: 'partial' }, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createRefund({ orderId: 'o1', amount: 30, type: 'partial', requestedById: 'admin1' });

      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.PARTIALLY_REFUNDED }),
      }));
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(result.type).toBe('partial');
    });

    it('skips credit note when invoice missing', async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrder({ invoice: null }));
      provider.refund.mockResolvedValue({ providerRefundId: 're_3', status: RefundStatus.COMPLETED });
      prisma.refund.create.mockResolvedValue({
        id: 'r3', orderId: 'o1', paymentId: 'pay1', providerRefundId: 're_3',
        amount: new Prisma.Decimal(100), reason: 'full refund', status: RefundStatus.COMPLETED,
        requestedById: null, approvedById: null,
        providerMetadata: { type: 'full' }, createdAt: new Date(), updatedAt: new Date(),
      });

      await service.createRefund({ orderId: 'o1', amount: 100, type: 'full' });
      expect(invoiceProvider.issueCreditNote).not.toHaveBeenCalled();
    });

    it('throws NotFound for unknown order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.createRefund({ orderId: 'nope', amount: 1, type: 'partial' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequest when full amount mismatches order total', async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrder());
      await expect(service.createRefund({ orderId: 'o1', amount: 50, type: 'full' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when partial amount >= order total', async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrder());
      await expect(service.createRefund({ orderId: 'o1', amount: 100, type: 'partial' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when no completed payment exists', async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrder({
        payments: [{ id: 'pay1', provider: PaymentProvider.STRIPE, status: PaymentStatus.PENDING, amount: new Prisma.Decimal(100), providerTransactionId: 'pi_1' }],
      }));
      await expect(service.createRefund({ orderId: 'o1', amount: 100, type: 'full' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when provider refund fails', async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrder());
      provider.refund.mockRejectedValue(new Error('provider down'));
      await expect(service.createRefund({ orderId: 'o1', amount: 100, type: 'full' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('approveRefund', () => {
    it('approves a pending refund', async () => {
      prisma.refund.findUnique.mockResolvedValue({
        id: 'r1', status: RefundStatus.PENDING, amount: new Prisma.Decimal(30), providerMetadata: { type: 'partial' },
      });
      prisma.refund.update.mockResolvedValue({
        id: 'r1', orderId: 'o1', paymentId: 'pay1', providerRefundId: 're_1',
        amount: new Prisma.Decimal(30), reason: 'partial refund', status: RefundStatus.COMPLETED,
        requestedById: null, approvedById: 'admin1',
        providerMetadata: { type: 'partial' }, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.approveRefund('r1', 'admin1');
      expect(result.status).toBe(RefundStatus.COMPLETED);
      expect(prisma.refund.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: RefundStatus.COMPLETED, approvedById: 'admin1' }),
      }));
      expect(auditLog.log).toHaveBeenCalled();
    });

    it('rejects approving non-pending refund', async () => {
      prisma.refund.findUnique.mockResolvedValue({ id: 'r1', status: RefundStatus.COMPLETED });
      await expect(service.approveRefund('r1', 'admin1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound for unknown refund', async () => {
      prisma.refund.findUnique.mockResolvedValue(null);
      await expect(service.approveRefund('nope', 'admin1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listRefunds', () => {
    it('lists refunds for an order', async () => {
      prisma.refund.findMany.mockResolvedValue([
        { id: 'r1', orderId: 'o1', paymentId: 'pay1', providerRefundId: 're_1', amount: new Prisma.Decimal(100), reason: 'full', status: RefundStatus.COMPLETED, requestedById: null, approvedById: null, providerMetadata: { type: 'full' }, createdAt: new Date(), updatedAt: new Date() },
      ]);
      const list = await service.listRefunds('o1');
      expect(list).toHaveLength(1);
      expect(list[0].type).toBe('full');
    });
  });

  it('does not reference PromotionType at runtime (sanity import)', () => {
    expect(PromotionType.PERCENTAGE).toBeDefined();
  });
});
