import { getServerApiClient } from '@/lib/api';
import { AccountingAdminPanel } from './accounting-admin-panel';

export default async function AdminAccountingPage() {
  const api = getServerApiClient();
  const [providers, records, marketplaceFees] = await Promise.all([
    api.accounting.providers(),
    api.accounting.syncRecords(),
    api.accounting.marketplaceFees(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Contabilidad / ERP</h1>
      <AccountingAdminPanel
        initialProviders={providers}
        initialRecords={records}
        initialMarketplaceFees={marketplaceFees}
      />
    </div>
  );
}
