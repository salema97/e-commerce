import { getServerApiClient } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/finance-page';
import { ExpensesView } from './expenses-view';
import type { Expense, ExpenseCategory } from '@repo/shared-types';

export default async function AdminFinanceExpensesPage() {
  await requireFinanceAccess('/admin/finance/expenses');
  const api = await getServerApiClient();
  const [initialExpenses, initialCategories] = await Promise.all([
    api.finance.expenses.findAll({ limit: 50 }).catch(() => [] as Expense[]),
    api.finance.expenseCategories.findAll().catch(() => [] as ExpenseCategory[]),
  ]);

  return (
    <ExpensesView
      initialExpenses={initialExpenses}
      initialCategories={initialCategories}
    />
  );
}
