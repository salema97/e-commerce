import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prisma: {
    expense: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    expenseCategory: { findUnique: ReturnType<typeof vi.fn> };
    supplier: { findUnique: ReturnType<typeof vi.fn> };
  };
  let receiptStorage: {
    parseKeys: ReturnType<typeof vi.fn>;
    appendReceipt: ReturnType<typeof vi.fn>;
    getSignedUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      expense: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      expenseCategory: { findUnique: vi.fn() },
      supplier: { findUnique: vi.fn() },
    };
    receiptStorage = {
      parseKeys: vi.fn(() => []),
      appendReceipt: vi.fn(),
      getSignedUrl: vi.fn(),
    };
    service = new ExpensesService(prisma as never, receiptStorage as never);
  });

  it('creates expense with default pending status', async () => {
    prisma.expense.create.mockResolvedValue({
      id: 'exp_1',
      categoryId: null,
      supplierId: null,
      amount: new Prisma.Decimal(100),
      date: new Date(),
      status: ExpenseStatus.PENDING,
      description: null,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({ amount: 100 });

    expect(result.status).toBe(ExpenseStatus.PENDING);
    expect(result.amount).toBe(100);
  });

  it('throws when expense not found', async () => {
    prisma.expense.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
