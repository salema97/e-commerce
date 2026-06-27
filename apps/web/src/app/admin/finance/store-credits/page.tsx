import { getServerApiClient } from '@/lib/api';
import { StoreCreditsView } from './store-credits-view';

export default async function StoreCreditsPage() {
  const api = await getServerApiClient();
  const storeCredits = await api.finance.storeCredits.findAll().catch(() => []);

  return <StoreCreditsView initialStoreCredits={storeCredits} />;
}
