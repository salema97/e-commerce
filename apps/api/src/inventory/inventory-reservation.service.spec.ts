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
    const order = {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    };
    const tx = {
      inventory: {
        findFirst: vi.fn().mockResolvedValue(inv),
        update: vi.fn().mockResolvedValue({ ...inv }),
      },
      order,
      $executeRaw: vi.fn().mockResolvedValue(1),
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    return {
      order,
      $transaction: vi.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
      $executeRaw: tx.$executeRaw,
      $queryRaw: tx.$queryRaw,
      inventory: tx.inventory,
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
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('throws when stock insufficient', async () => {
    prisma.$executeRaw.mockResolvedValue(0);
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

  it('sorts items by productId and locks rows before updating', async () => {
    const items = [
      { productId: 'p3', variantId: null, quantity: 1 },
      { productId: 'p1', variantId: null, quantity: 2 },
      { productId: 'p2', variantId: null, quantity: 1 },
    ];
    prisma.inventory.findFirst
      .mockResolvedValueOnce({ id: 'inv_p3', quantity: 10, reservedQuantity: 0 })
      .mockResolvedValueOnce({ id: 'inv_p1', quantity: 10, reservedQuantity: 0 })
      .mockResolvedValueOnce({ id: 'inv_p2', quantity: 10, reservedQuantity: 0 });

    await service.reserveItems(items);

    const ids = prisma.inventory.findFirst.mock.calls.map((call) => call[0].where.productId);
    expect(ids).toEqual(['p1', 'p2', 'p3']);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(3);
  });

  it('cancels expired reservations', async () => {
    const txOrderUpdate = vi.fn();
    prisma.order.findMany.mockResolvedValue([{ id: 'o2' }]);
    prisma.$transaction.mockImplementation(async (cb: (tx: {
      order: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
      inventory: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
      $executeRaw: ReturnType<typeof vi.fn>;
      $queryRaw: ReturnType<typeof vi.fn>;
    }) => Promise<unknown>) =>
      cb({
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'o2',
            items: [{ productId: 'p1', variantId: null, quantity: 1 }],
          }),
          update: txOrderUpdate,
        },
        inventory: prisma.inventory,
        $executeRaw: prisma.$executeRaw,
        $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
      }),
    );
    expect(await service.releaseExpiredReservations(new Date())).toBe(1);
    expect(txOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.CANCELLED }) }),
    );
  });
});
