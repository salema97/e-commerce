import { getServerApiClient } from '@/lib/api';
import { MarketplaceAdminPanel } from './marketplace-admin-panel';

export default async function AdminMarketplacePage() {
  const api = await getServerApiClient();
  const [channels, listings] = await Promise.all([
    api.marketplace.channels().catch(() => []),
    api.marketplace.listings().catch(() => []),
  ]);

  return (
    <MarketplaceAdminPanel initialChannels={channels} initialListings={listings} />
  );
}
