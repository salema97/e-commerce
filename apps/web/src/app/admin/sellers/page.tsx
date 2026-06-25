import { getServerApiClient } from '@/lib/api';
import { SellersAdminPanel } from './sellers-admin-panel';

export default async function AdminSellersPage() {
  const api = await getServerApiClient();
  const sellers = await api.sellers.list().catch(() => []);

  return <SellersAdminPanel initialSellers={sellers} />;
}
