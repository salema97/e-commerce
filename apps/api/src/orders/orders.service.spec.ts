import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryReservationService } from '../inventory/inventory-reservation.service.js';
import { PromotionService } from '../promotions/promotion.service.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';
import { EmailNotificationService } from '../notifications/email-notification.service.js';
import { MarketingAutomationService } from '../notifications/marketing-automation.service.js';
import { OrderSummaryPdfService } from '../receipts/order-summary-pdf.service.js';
import { PushNotificationService } from '../notifications/push-notification.service.js';
import { OrderChannel, OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof mockPrisma>;
  let reservation: { reserveItems: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn>; reservationExpiry: ReturnType<typeof vi.fn> };
  let promotion: {
    validateCoupon: ReturnType<typeof vi.fn>;
    calculateOrderTotals: ReturnType<typeof vi.fn>;
    incrementCouponUsage: ReturnType<typeof vi.fn>;
  };
  let notificationService: { notify: ReturnType<typeof vi.fn> };
  let emailNotificationService: { notify: ReturnType<typeof vi.fn> };
  let pushNotificationService: { notifyForOrder: ReturnType<typeof vi.fn> };
  let marketingAutomation: { trackPurchaseEvent: ReturnType<typeof vi.fn> };
  let orderSummaryPdf: { buildEmailAttachment: ReturnType<typeof vi.fn> };

  function mockPrisma() {
    return {
      user: { findUnique: vi.fn().mockResolvedValue({ email: 'user@example.com' }) },
      product: { findUnique: vi.fn().mockResolvedValue({ id: 'p1', name: 'Product', sku: 'SKU', variants: [] }) },
      order: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    };
  }

  beforeEach(async () => {
    prisma = mockPrisma();
    reservation = { reserveItems: vi.fn(), release: vi.fn(), reservationExpiry: vi.fn(() => new Date('2026-06-22T01:00:00Z')) };
    promotion = {
      validateCoupon: vi.fn(),
      calculateOrderTotals: vi.fn(),
      incrementCouponUsage: vi.fn(),
    };
    notificationService = { notify: vi.fn().mockResolvedValue(undefined) };
    emailNotificationService = { notify: vi.fn().mockResolvedValue(undefined) };
    pushNotificationService = { notifyForOrder: vi.fn().mockResolvedValue(undefined) };
    marketingAutomation = { trackPurchaseEvent: vi.fn().mockResolvedValue(undefined) };
    orderSummaryPdf = { buildEmailAttachment: vi.fn().mockResolvedValue(undefined) };
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryReservationService, useValue: reservation },
        { provide: PromotionService, useValue: promotion },
        { provide: WhatsAppNotificationService, useValue: notificationService },
        { provide: EmailNotificationService, useValue: emailNotificationService },
        { provide: PushNotificationService, useValue: pushNotificationService },
        { provide: MarketingAutomationService, useValue: marketingAutomation },
        { provide: OrderSummaryPdfService, useValue: orderSummaryPdf },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  const mockCreatedOrder = (items = [{ productId: 'p1', variantId: null, name: 'Product', sku: 'SKU', price: new Prisma.Decimal(19.99), quantity: 2 }]) => ({
    id: 'o1', orderNumber: 'ORD-1', status: OrderStatus.PAYMENT_PENDING, channel: OrderChannel.WEB,
    subtotal: new Prisma.Decimal(39.98), taxAmount: new Prisma.Decimal(6), shippingAmount: new Prisma.Decimal(0),
    discountAmount: new Prisma.Decimal(0), total: new Prisma.Decimal(45.98), couponCode: null,
    reservationExpiresAt: new Date('2026-06-22T01:00:00Z'), items,
  });

  it('creates an order and reserves inventory', async () => {
    promotion.calculateOrderTotals.mockResolvedValue({ subtotal: 39.98, discount: 0, taxAmount: 6, shipping: 0, total: 45.98 });
    prisma.order.create.mockResolvedValue(mockCreatedOrder());
    const result = await service.createOrder('u1', { items: [{ productId: 'p1', quantity: 2, price: 19.99 }] });
    expect(reservation.reserveItems).toHaveBeenCalledWith([{ productId: 'p1', variantId: undefined, quantity: 2 }]);
    expect(promotion.calculateOrderTotals).toHaveBeenCalled();
    expect(result.status).toBe(OrderStatus.PAYMENT_PENDING);
    expect(result.total).toBe(45.98);
  });

  it('validates coupon before reserving inventory', async () => {
    promotion.validateCoupon.mockResolvedValue({ coupon: { code: 'SAVE10' }, subtotal: 100 });
    promotion.calculateOrderTotals.mockResolvedValue({ subtotal: 100, discount: 10, taxAmount: 13.5, shipping: 0, total: 103.5 });
    prisma.order.create.mockResolvedValue(mockCreatedOrder());

    await service.createOrder('u1', { items: [{ productId: 'p1', quantity: 2, price: 50 }], couponCode: 'SAVE10' });

    expect(promotion.validateCoupon).toHaveBeenCalledBefore(reservation.reserveItems);
    expect(promotion.incrementCouponUsage).toHaveBeenCalledWith('SAVE10');
  });

  it('does not validate coupon when none provided', async () => {
    promotion.calculateOrderTotals.mockResolvedValue({ subtotal: 39.98, discount: 0, taxAmount: 6, shipping: 0, total: 45.98 });
    prisma.order.create.mockResolvedValue(mockCreatedOrder());
    await service.createOrder('u1', { items: [{ productId: 'p1', quantity: 2, price: 19.99 }] });
    expect(promotion.validateCoupon).not.toHaveBeenCalled();
    expect(promotion.incrementCouponUsage).not.toHaveBeenCalled();
  });

  it('requires email for guest orders', async () => {
    await expect(service.createOrder(undefined, { items: [{ productId: 'p1', quantity: 1, price: 10 }] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty items', async () => {
    await expect(service.createOrder('u1', { items: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.createOrder('u1', { items: [{ productId: 'x', quantity: 1, price: 10 }] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('gets order by id', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'o1', items: [], statusHistory: [] });
    expect((await service.getOrderById('o1')).id).toBe('o1');
  });

  it('throws when order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(service.getOrderById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates order status', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'o1', status: OrderStatus.PAYMENT_PENDING });
    await service.updateOrderStatus('o1', OrderStatus.PROCESSING);
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.PROCESSING }) }));
  });

  it('sends a WhatsApp confirmation when order moves to PROCESSING', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: OrderStatus.PAYMENT_PENDING,
      customerPhone: '+593991234567',
      orderNumber: 'ORD-1',
      total: new Prisma.Decimal(45.98),
      user: { whatsappOptOut: false },
    });
    prisma.order.update.mockResolvedValue({ id: 'o1', status: OrderStatus.PROCESSING });

    await service.updateOrderStatus('o1', OrderStatus.PROCESSING);

    expect(notificationService.notify).toHaveBeenCalledWith(
      'o1',
      'ORDER_CONFIRMED',
      '+593991234567',
      expect.objectContaining({ orderNumber: 'ORD-1', total: 'USD 45.98' }),
    );
  });

  it('completes status update even if WhatsApp notification rejects', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: OrderStatus.PAYMENT_PENDING,
      customerPhone: '+593991234567',
      orderNumber: 'ORD-1',
      total: new Prisma.Decimal(45.98),
      user: { whatsappOptOut: false },
    });
    prisma.order.update.mockResolvedValue({ id: 'o1', status: OrderStatus.PROCESSING });
    notificationService.notify.mockRejectedValue(new Error('WhatsApp down'));

    const result = await service.updateOrderStatus('o1', OrderStatus.PROCESSING);

    expect(result.status).toBe(OrderStatus.PROCESSING);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.PROCESSING }) }),
    );
  });

  it('cancels an order and releases reservation', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'o1', userId: 'u1', status: OrderStatus.PAYMENT_PENDING });
    await service.cancelOrder('o1', 'u1');
    expect(reservation.release).toHaveBeenCalledWith('o1');
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.CANCELLED }) }));
  });

  it('prevents cancelling shipped orders', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'o1', userId: 'u1', status: OrderStatus.SHIPPED });
    await expect(service.cancelOrder('o1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
