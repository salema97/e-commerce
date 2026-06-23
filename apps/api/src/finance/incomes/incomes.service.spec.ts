import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { IncomeSource, Prisma } from '@prisma/client';
import { IncomesService } from './incomes.service.js';

describe('IncomesService', () => {
  let service: IncomesService;
  let prisma: {
    income: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    order: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      income: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
      },
    };
    service = new IncomesService(prisma as never);
  });

  it('creates income linked to an existing order', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'order_1' });
    prisma.income.create.mockResolvedValue({
      id: 'inc_1',
      source: IncomeSource.ORDER,
      amount: new Prisma.Decimal(100),
      date: new Date('2026-06-01'),
      relatedOrderId: 'order_1',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      source: IncomeSource.ORDER,
      amount: 100,
      relatedOrderId: 'order_1',
    });

    expect(result.amount).toBe(100);
    expect(result.relatedOrderId).toBe('order_1');
  });

  it('throws when related order does not exist', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        source: IncomeSource.ORDER,
        amount: 50,
        relatedOrderId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists incomes with date filter', async () => {
    prisma.income.findMany.mockResolvedValue([]);

    await service.findAll({
      from: new Date('2026-06-01'),
      to: new Date('2026-06-30'),
    });

    expect(prisma.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date('2026-06-01'),
            lte: new Date('2026-06-30'),
          },
        }),
      }),
    );
  });
});
