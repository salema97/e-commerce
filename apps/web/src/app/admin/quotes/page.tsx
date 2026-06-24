import { getServerApiClient } from '@/lib/api';
import { QuotesAdminPanel } from './quotes-admin-panel';

export default async function AdminQuotesPage() {
  const api = getServerApiClient();
  const quotes = await api.quotes.adminList();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Cotizaciones B2B</h1>
      <QuotesAdminPanel initialQuotes={quotes} />
    </div>
  );
}
