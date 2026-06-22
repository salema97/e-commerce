import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryReservationService } from '../inventory/inventory-reservation.service.js';
import { OrderChannel, OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof mockPrisma>;
  let reservation: { reserveItems: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn>; reservationExpiry: ReturnType<typeof vi.fn> };

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
    const module = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }, { provide: InventoryReservationService, useValue: reservation }],
    }).compile();
    service = module.get(OrdersService);
  });

  const mockCreatedOrder = (items = [{ productId: 'p1', variantId: null, name: 'Product', sku: 'SKU', price: new Prisma.Decimal(19.99), quantity: 2 }]) => ({
    id: 'o1', orderNumber: 'ORD-1', status: OrderStatus.PAYMENT_PENDING, channel: OrderChannel.WEB,
    subtotal: new Prisma.Decimal(39.98), taxAmount: new Prisma.Decimal(0), shippingAmount: new Prisma.Decimal(0),
    discountAmount: new Prisma.Decimal(0), total: new Prisma.Decimal(39.98), couponCode: null,
    reservationExpiresAt: new Date('2026-06-22T01:00:00Z'), items,
  });

  it('creates an order and reserves inventory', async () => {
    prisma.order.create.mockResolvedValue(mockCreatedOrder());
    const result = await service.createOrder('u1', { items: [{ productId: 'p1', quantity: 2, price: 19.99 }] });
    expect(reservation.reserveItems).toHaveBeenCalledWith([{ productId: 'p1', variantId: undefined, quantity: 2 }]);
    expect(result.status).toBe(OrderStatus.PAYMENT_PENDING);
    expect(result.total).toBe(39.98);
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
