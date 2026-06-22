import type { IncomeSource, ExpenseStatus } from './enums.js';

export interface Income {
  id: string;
  source: IncomeSource;
  amount: number;
  date: string;
  relatedOrderId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeDto {
  source: IncomeSource;
  amount: number;
  date?: string;
  relatedOrderId?: string;
  notes?: string;
}

export type UpdateIncomeDto = Partial<CreateIncomeDto>;

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  expenses?: unknown[];
}

export interface Expense {
  id: string;
  categoryId?: string | null;
  supplierId?: string | null;
  amount: number;
  date: string;
  status: ExpenseStatus;
  description?: string | null;
  attachments?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  category?: unknown;
  supplier?: unknown;
}

export interface CreateExpenseDto {
  categoryId?: string;
  supplierId?: string;
  amount: number;
  date?: string;
  status?: ExpenseStatus;
  description?: string;
  attachments?: Record<string, unknown>;
}

export type UpdateExpenseDto = Partial<CreateExpenseDto>;

export interface CashFlowReport {
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  incomeBySource: Record<IncomeSource, number>;
  expensesByCategory: Record<string, number>;
}
