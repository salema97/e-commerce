import { getServerApiClient } from '@/lib/api';
import { QuotesAdminPanel } from './quotes-admin-panel';

export default async function AdminQuotesPage() {
  const api = await getServerApiClient();
  const quotes = await api.quotes.adminList().catch(() => []);

  return <QuotesAdminPanel initialQuotes={quotes} />;
}
