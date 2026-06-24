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

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
}

export type UpdateExpenseCategoryDto = Partial<CreateExpenseCategoryDto>;

export interface Expense {
  id: string;
  categoryId?: string | null;
  supplierId?: string | null;
  amount: number;
  date: string;
  status: ExpenseStatus;
  description?: string | null;
  attachmentKeys?: string[];
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
}

export type UpdateExpenseDto = Partial<CreateExpenseDto>;

export interface UploadExpenseReceiptDto {
  fileName: string;
  contentBase64: string;
  contentType?: string;
}

export interface AdminStoreCredit {
  id: string;
  userId: string;
  userEmail?: string | null;
  balance: number;
  currency: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashFlowReport {
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  incomeBySource: Record<IncomeSource, number>;
  expensesByCategory: Record<string, number>;
}
