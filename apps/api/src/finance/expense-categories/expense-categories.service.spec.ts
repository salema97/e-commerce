import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ExpenseCategoriesService } from './expense-categories.service.js';

describe('ExpenseCategoriesService', () => {
  let service: ExpenseCategoriesService;
  let prisma: {
    expenseCategory: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      expenseCategory: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new ExpenseCategoriesService(prisma as never);
  });

  it('creates a category with trimmed name', async () => {
    prisma.expenseCategory.create.mockResolvedValue({
      id: 'cat_1',
      name: 'Logistics',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({ name: '  Logistics  ' });

    expect(prisma.expenseCategory.create).toHaveBeenCalledWith({
      data: { name: 'Logistics', description: null },
    });
    expect(result.name).toBe('Logistics');
  });

  it('maps duplicate name to conflict', async () => {
    prisma.expenseCategory.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.create({ name: 'Logistics' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws when category not found', async () => {
    prisma.expenseCategory.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
