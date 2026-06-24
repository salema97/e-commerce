import { getServerApiClient } from '@/lib/api';
import { defaultFinanceMonthRange, requireFinanceAccess } from '@/lib/finance-page';
import { ReportsView } from './reports-view';
import type { AdminStoreCredit, CashFlowReport } from '@repo/shared-types';

export default async function AdminFinanceReportsPage() {
  await requireFinanceAccess('/admin/finance/reports');
  const api = await getServerApiClient();
  const initialRange = defaultFinanceMonthRange();

  const [initialStoreCredits, initialCashFlow] = await Promise.all([
    api.finance.storeCredits.findAll().catch(() => [] as AdminStoreCredit[]),
    api.finance.reports
      .cashFlow(initialRange.from, initialRange.to)
      .catch(() => null as CashFlowReport | null),
  ]);

  return (
    <ReportsView
      initialRange={initialRange}
      initialStoreCredits={initialStoreCredits}
      initialCashFlow={initialCashFlow}
    />
  );
}
