import { getServerApiClient } from '@/lib/api';
import { AccountingAdminPanel } from './accounting-admin-panel';

export default async function AdminAccountingPage() {
  const api = await getServerApiClient();
  const [providers, records, marketplaceFees] = await Promise.all([
    api.accounting.providers().catch(() => []),
    api.accounting.syncRecords().catch(() => []),
    api.accounting.marketplaceFees().catch(() => []),
  ]);

  return (
    <AccountingAdminPanel
      initialProviders={providers}
      initialRecords={records}
      initialMarketplaceFees={marketplaceFees}
    />
  );
}
