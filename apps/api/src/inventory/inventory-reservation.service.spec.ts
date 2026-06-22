import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryReservationService } from './inventory-reservation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus } from '@prisma/client';

describe('InventoryReservationService', () => {
  let service: InventoryReservationService;
  let prisma: ReturnType<typeof mockPrisma>;

  function mockPrisma() {
    const inv = { id: 'inv_1', quantity: 10, reservedQuantity: 0 };
    const tx = {
      inventory: {
        findFirst: vi.fn().mockResolvedValue(inv),
        update: vi.fn().mockResolvedValue({ ...inv }),
      },
    };
    return {
      order: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
      $transaction: vi.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
      ...tx,
    };
  }

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [InventoryReservationService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(InventoryReservationService);
  });

  it('reserves stock for an order', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'o1', items: [{ productId: 'p1', variantId: null, quantity: 3 }] });
    await service.reserve('o1');
    expect(prisma.inventory.update).toHaveBeenCalledWith(expect.objectContaining({ data: { reservedQuantity: { increment: 3 } } }));
  });

  it('throws when stock insufficient', async () => {
    await expect(service.reserveItems([{ productId: 'p1', variantId: null, quantity: 20 }])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(service.reserve('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('releases and confirms reservations', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'o1', items: [{ productId: 'p1', variantId: null, quantity: 2 }] });
    await service.release('o1');
    await service.confirm('o1');
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('cancels expired reservations', async () => {
    prisma.order.findMany.mockResolvedValue([{ id: 'o2' }]);
    prisma.order.findUnique.mockResolvedValue({ id: 'o2', items: [{ productId: 'p1', variantId: null, quantity: 1 }] });
    expect(await service.releaseExpiredReservations(new Date())).toBe(1);
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.CANCELLED }) }));
  });
});
