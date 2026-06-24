import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ExpenseStatus, IncomeSource, Prisma } from '@prisma/client';
import { FinanceReportsService } from './finance-reports.service.js';

describe('FinanceReportsService', () => {
  let service: FinanceReportsService;
  let prisma: {
    income: { findMany: ReturnType<typeof vi.fn> };
    expense: { findMany: ReturnType<typeof vi.fn> };
    expenseCategory: { findMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    prisma = {
      income: { findMany: vi.fn() },
      expense: { findMany: vi.fn() },
      expenseCategory: { findMany: vi.fn() },
    };
    service = new FinanceReportsService(prisma as never);
  });

  it('rejects inverted date range', async () => {
    await expect(
      service.getCashFlow(new Date('2026-06-30'), new Date('2026-06-01')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates income and expenses', async () => {
    prisma.income.findMany.mockResolvedValue([
      { source: IncomeSource.ORDER, amount: new Prisma.Decimal(100) },
      { source: IncomeSource.OTHER, amount: new Prisma.Decimal(50) },
    ]);
    prisma.expense.findMany.mockResolvedValue([
      { categoryId: 'cat_1', amount: new Prisma.Decimal(30) },
    ]);
    prisma.expenseCategory.findMany.mockResolvedValue([
      { id: 'cat_1', name: 'Logística' },
    ]);

    const report = await service.getCashFlow(
      new Date('2026-06-01'),
      new Date('2026-06-30'),
    );

    expect(report.totalIncome).toBe(150);
    expect(report.totalExpenses).toBe(30);
    expect(report.netCashFlow).toBe(120);
    expect(report.expensesByCategory['Logística']).toBe(30);
  });
});
