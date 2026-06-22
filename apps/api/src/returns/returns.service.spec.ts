import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, OrderStatus, ReturnStatus, RefundMethod, PaymentStatus } from '@prisma/client';
import { ReturnsService } from './returns.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit/audit-log.service.js';
import { RefundService } from '../payments/refund.service.js';
import { StoreCreditService } from './store-credit.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { ReturnNotificationService } from './notifications/return-notification.service.js';

function buildTxClient() {
  return {
    storeCredit: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    inventory: { findFirst: vi.fn(), update: vi.fn() },
  };
}

function buildPrismaMock() {
  const txClient = buildTxClient();
  return {
    returnRequest: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    order: { findUnique: vi.fn(), create: vi.fn() },
    product: { findUnique: vi.fn() },
    inventory: { findFirst: vi.fn(), update: vi.fn() },
    storeCredit: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    creditNote: { findFirst: vi.fn(), create: vi.fn(), findUniqueOrThrow: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
    __txClient: txClient,
  };
}

describe('ReturnsService', () => {
  let service: ReturnsService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let auditLog: { log: ReturnType<typeof vi.fn> };
  let configService: { get: ReturnType<typeof vi.fn> };
  let refundService: { createRefund: ReturnType<typeof vi.fn> };
  let storeCreditService: { issue: ReturnType<typeof vi.fn> };
  let invoicesService: { issueCreditNote: ReturnType<typeof vi.fn> };
  let notificationService: {
    onReturnRequested: ReturnType<typeof vi.fn>;
    onReturnStatusChanged: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = buildPrismaMock();
    auditLog = { log: vi.fn().mockResolvedValue(undefined) };
    configService = { get: vi.fn(() => 30) };
    refundService = { createRefund: vi.fn().mockResolvedValue({ id: 'r1' }) };
    storeCreditService = { issue: vi.fn().mockResolvedValue({ balance: 100 }) };
    invoicesService = { issueCreditNote: vi.fn().mockResolvedValue({ id: 'cn1' }) };
    notificationService = {
      onReturnRequested: vi.fn().mockResolvedValue(undefined),
      onReturnStatusChanged: vi.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: RefundService, useValue: refundService },
        { provide: StoreCreditService, useValue: storeCreditService },
        { provide: InvoicesService, useValue: invoicesService },
        { provide: ReturnNotificationService, useValue: notificationService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    service = module.get(ReturnsService);
  });

  function buildDeliveredOrder(overrides: Partial<{
    id: string;
    userId: string | null;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
    customerEmail: string;
    user: { email: string } | null;
    payments: Array<{ status: PaymentStatus; amount: Prisma.Decimal }>;
    items: Array<{ id: string; productId: string; variantId: string | null; quantity: number; price?: Prisma.Decimal }>;
  }> = {}) {
    return {
      id: 'o1',
      userId: 'u1',
      status: OrderStatus.DELIVERED,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerEmail: 'customer@example.com',
      user: { email: 'customer@example.com' },
      payments: [{ status: PaymentStatus.COMPLETED, amount: new Prisma.Decimal(100) }],
      items: [{ id: 'oi1', productId: 'p1', variantId: null, quantity: 2, price: new Prisma.Decimal(50) }],
      ...overrides,
    };
  }

  describe('createReturnRequest', () => {
    it('creates a return request for a delivered order owned by the user', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder());
      prisma.returnRequest.create.mockResolvedValue({
        id: 'rr1', orderId: 'o1', status: ReturnStatus.REQUESTED,
        items: [{ id: 'ri1', productId: 'p1', quantity: 1 }],
      });

      const result = await service.createReturnRequest({
        orderId: 'o1', userId: 'u1', reason: 'damaged on arrival', items: [{ productId: 'p1', quantity: 1 }],
      });

      expect(result.id).toBe('rr1');
      expect(auditLog.log).toHaveBeenCalled();
      expect(notificationService.onReturnRequested).toHaveBeenCalled();
    });

    it('throws NotFound when order is missing', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.createReturnRequest({
        orderId: 'missing', userId: 'u1', reason: 'x', items: [{ productId: 'p1', quantity: 1 }],
      })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when user requests a return for another user order', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder({ userId: 'someone-else' }));
      await expect(service.createReturnRequest({
        orderId: 'o1', userId: 'u1', reason: 'x', items: [{ productId: 'p1', quantity: 1 }],
      })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequest when order is not delivered', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder({ status: OrderStatus.SHIPPED }));
      await expect(service.createReturnRequest({
        orderId: 'o1', userId: 'u1', reason: 'x', items: [{ productId: 'p1', quantity: 1 }],
      })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when return window has elapsed', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder({ createdAt: oldDate }));
      await expect(service.createReturnRequest({
        orderId: 'o1', userId: 'u1', reason: 'x', items: [{ productId: 'p1', quantity: 1 }],
      })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createGuestReturn', () => {
    it('creates a return request when email matches order.customerEmail', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder({ userId: null }));
      prisma.returnRequest.create.mockResolvedValue({
        id: 'rr_guest', orderId: 'o1', userId: null, status: ReturnStatus.REQUESTED,
        items: [{ id: 'ri1', productId: 'p1', quantity: 1 }],
      });

      const result = await service.createGuestReturn({
        orderId: 'o1',
        email: 'customer@example.com',
        reason: 'damaged on arrival',
        items: [{ productId: 'p1', quantity: 1 }],
      });

      expect(result.id).toBe('rr_guest');
      expect(auditLog.log).toHaveBeenCalled();
      expect(notificationService.onReturnRequested).toHaveBeenCalled();
    });

    it('falls back to user email when order.customerEmail is missing', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder({
        userId: 'u1',
        customerEmail: '',
      }));
      prisma.returnRequest.create.mockResolvedValue({
        id: 'rr_guest', orderId: 'o1', userId: 'u1', status: ReturnStatus.REQUESTED,
        items: [{ id: 'ri1', productId: 'p1', quantity: 1 }],
      });

      const result = await service.createGuestReturn({
        orderId: 'o1',
        email: 'customer@example.com',
        reason: 'damaged on arrival',
        items: [{ productId: 'p1', quantity: 1 }],
      });

      expect(result.id).toBe('rr_guest');
    });

    it('throws Forbidden when email does not match', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder({ userId: null }));
      await expect(service.createGuestReturn({
        orderId: 'o1',
        email: 'wrong@example.com',
        reason: 'x',
        items: [{ productId: 'p1', quantity: 1 }],
      })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequest when order has no completed payment', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder({
        userId: null,
        payments: [{ status: PaymentStatus.PENDING, amount: new Prisma.Decimal(100) }],
      }));
      await expect(service.createGuestReturn({
        orderId: 'o1',
        email: 'customer@example.com',
        reason: 'x',
        items: [{ productId: 'p1', quantity: 1 }],
      })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('rejects invalid transition REQUESTED -> INSPECTION', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({ id: 'rr1', status: ReturnStatus.REQUESTED, items: [] });
      await expect(service.updateStatus('rr1', { status: ReturnStatus.INSPECTION }, 'admin1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transitions REQUESTED -> APPROVED and records approver', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({ id: 'rr1', status: ReturnStatus.REQUESTED, items: [] });
      prisma.returnRequest.update.mockResolvedValue({ id: 'rr1', status: ReturnStatus.APPROVED, approvedById: 'admin1', items: [] });
      const result = await service.updateStatus('rr1', { status: ReturnStatus.APPROVED }, 'admin1');
      expect(result.status).toBe(ReturnStatus.APPROVED);
      expect(notificationService.onReturnStatusChanged).toHaveBeenCalled();
    });
  });

  describe('resolveReturn', () => {
    function buildReturnForResolve(status = ReturnStatus.INSPECTION, overrides = {}) {
      return {
        id: 'rr1',
        orderId: 'o1',
        userId: 'u1',
        status,
        reason: 'Damaged',
        refundMethod: null,
        items: [{ id: 'ri1', productId: 'p1', productVariantId: null, quantity: 1, refundValue: null }],
        order: {
          id: 'o1',
          orderNumber: 'ORD-1',
          userId: 'u1',
          customerEmail: 'customer@example.com',
          customerPhone: null,
          status: OrderStatus.DELIVERED,
          subtotal: new Prisma.Decimal(50),
          taxAmount: new Prisma.Decimal(0),
          shippingAmount: new Prisma.Decimal(0),
          discountAmount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(50),
          items: [{ id: 'oi1', productId: 'p1', variantId: null, name: 'Product', sku: 'SKU-1', price: new Prisma.Decimal(50), quantity: 1 }],
          invoice: { accessKey: '1'.repeat(49) },
        },
        ...overrides,
      };
    }

    it('refunds original payment, restocks, and issues credit note via RefundService', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue(buildReturnForResolve());
      prisma.returnRequest.update.mockResolvedValue({ id: 'rr1', status: ReturnStatus.RESOLVED, refundMethod: RefundMethod.ORIGINAL_PAYMENT, items: [] });
      prisma.__txClient.inventory.findFirst.mockResolvedValue({ id: 'inv1', productId: 'p1', variantId: null, quantity: 10, reservedQuantity: 0 });

      const result = await service.resolveReturn('rr1', { refundMethod: RefundMethod.ORIGINAL_PAYMENT }, 'admin1');

      expect(result.status).toBe(ReturnStatus.RESOLVED);
      expect(refundService.createRefund).toHaveBeenCalledWith(expect.objectContaining({
        returnRequestId: 'rr1',
        amount: 50,
        parentInvoiceAccessKey: '1'.repeat(49),
      }));
      expect(prisma.__txClient.inventory.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ quantity: { increment: 1 } }) }));
      expect(invoicesService.issueCreditNote).not.toHaveBeenCalled();
    });

    it('issues store credit when method is STORE_CREDIT', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue(buildReturnForResolve());
      prisma.returnRequest.update.mockResolvedValue({ id: 'rr1', status: ReturnStatus.RESOLVED, refundMethod: RefundMethod.STORE_CREDIT, items: [] });
      prisma.__txClient.inventory.findFirst.mockResolvedValue({ id: 'inv1', productId: 'p1', variantId: null, quantity: 10, reservedQuantity: 0 });

      const result = await service.resolveReturn('rr1', { refundMethod: RefundMethod.STORE_CREDIT }, 'admin1');

      expect(result.status).toBe(ReturnStatus.RESOLVED);
      expect(storeCreditService.issue).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', amount: 50 }));
      expect(refundService.createRefund).not.toHaveBeenCalled();
    });

    it('enters compensating state when credit note fails for store credit', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue(buildReturnForResolve());
      prisma.returnRequest.update
        .mockResolvedValueOnce({ id: 'rr1', status: ReturnStatus.RESOLVED, refundMethod: RefundMethod.STORE_CREDIT, items: [] })
        .mockResolvedValueOnce({ id: 'rr1', status: ReturnStatus.RESOLUTION_PENDING_CREDIT_NOTE, items: [] });
      prisma.__txClient.inventory.findFirst.mockResolvedValue({ id: 'inv1', productId: 'p1', variantId: null, quantity: 10, reservedQuantity: 0 });
      invoicesService.issueCreditNote.mockRejectedValue(new Error('SRI down'));

      const result = await service.resolveReturn('rr1', { refundMethod: RefundMethod.STORE_CREDIT }, 'admin1');

      expect(result.status).toBe(ReturnStatus.RESOLUTION_PENDING_CREDIT_NOTE);
      expect(invoicesService.issueCreditNote).toHaveBeenCalled();
    });

    it('throws when resolving from a non-inspecting status', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue(buildReturnForResolve(ReturnStatus.REQUESTED));
      await expect(service.resolveReturn('rr1', { refundMethod: RefundMethod.ORIGINAL_PAYMENT }, 'admin1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
