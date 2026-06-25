import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SellersService } from './sellers.service.js';
import { Prisma } from '@prisma/client';

describe('SellersService', () => {
  let service: SellersService;
  let prisma: {
    orderItem: { findMany: ReturnType<typeof vi.fn> };
    sellerPayout: { create: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    prisma = {
      orderItem: { findMany: vi.fn() },
      sellerPayout: { create: vi.fn() },
    };
    service = new SellersService(prisma as never);
  });

  it('creates seller payouts grouped by seller', async () => {
    prisma.orderItem.findMany.mockResolvedValue([
      {
        sellerId: 's1',
        price: new Prisma.Decimal(100),
        quantity: 1,
        sellerCommissionAmount: new Prisma.Decimal(15),
        seller: { id: 's1' },
      },
    ]);

    await service.createPayoutsForOrder('o1');

    expect(prisma.sellerPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sellerId: 's1',
        orderId: 'o1',
        grossAmount: expect.any(Prisma.Decimal),
        commissionAmount: expect.any(Prisma.Decimal),
        netAmount: expect.any(Prisma.Decimal),
      }),
    });
  });
});
