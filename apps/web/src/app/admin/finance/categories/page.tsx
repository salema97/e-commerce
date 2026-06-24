import { getServerApiClient } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/finance-page';
import { CategoriesView } from './categories-view';
import type { ExpenseCategory } from '@repo/shared-types';

export default async function AdminFinanceCategoriesPage() {
  await requireFinanceAccess('/admin/finance/categories');
  const api = await getServerApiClient();
  const initialCategories = await api.finance.expenseCategories
    .findAll()
    .catch(() => [] as ExpenseCategory[]);

  return <CategoriesView initialCategories={initialCategories} />;
}
