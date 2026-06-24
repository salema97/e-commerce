import { Injectable, BadRequestException } from '@nestjs/common';
import { ExpenseStatus, IncomeSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CashFlowReportDto } from './dto/cash-flow-report.dto.js';

@Injectable()
export class FinanceReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCashFlow(from: Date, to: Date): Promise<CashFlowReportDto> {
    if (from > to) {
      throw new BadRequestException('from must be before or equal to to');
    }

    const dateFilter = { gte: from, lte: to };

    const [incomes, expenses, categories] = await Promise.all([
      this.prisma.income.findMany({
        where: { date: dateFilter },
        select: { source: true, amount: true },
      }),
      this.prisma.expense.findMany({
        where: {
          date: dateFilter,
          status: { not: ExpenseStatus.CANCELLED },
        },
        select: { categoryId: true, amount: true },
      }),
      this.prisma.expenseCategory.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const incomeBySource: Record<IncomeSource, number> = {
      ORDER: 0,
      INVESTMENT: 0,
      OTHER: 0,
    };

    let totalIncome = 0;
    for (const income of incomes) {
      const amount = Number(income.amount);
      totalIncome += amount;
      incomeBySource[income.source] += amount;
    }

    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
    const expensesByCategory: Record<string, number> = {};
    let totalExpenses = 0;

    for (const expense of expenses) {
      const amount = Number(expense.amount);
      totalExpenses += amount;
      const label = expense.categoryId
        ? (categoryNames.get(expense.categoryId) ?? expense.categoryId)
        : 'Sin categoría';
      expensesByCategory[label] = (expensesByCategory[label] ?? 0) + amount;
    }

    return {
      periodStart: from,
      periodEnd: to,
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      incomeBySource,
      expensesByCategory,
    };
  }
}
