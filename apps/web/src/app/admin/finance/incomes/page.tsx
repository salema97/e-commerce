import { getServerApiClient } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/finance-page';
import { IncomesView } from './incomes-view';
import type { Income } from '@repo/shared-types';

export default async function AdminFinanceIncomesPage() {
  await requireFinanceAccess('/admin/finance/incomes');
  const api = await getServerApiClient();
  const initialIncomes = await api.finance.incomes
    .findAll({ limit: 50 })
    .catch(() => [] as Income[]);

  return <IncomesView initialIncomes={initialIncomes} />;
}
