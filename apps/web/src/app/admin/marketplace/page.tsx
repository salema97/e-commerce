import { getServerApiClient } from '@/lib/api';
import { MarketplaceAdminPanel } from './marketplace-admin-panel';

export default async function AdminMarketplacePage() {
  const api = getServerApiClient();
  const [channels, listings] = await Promise.all([
    api.marketplace.channels(),
    api.marketplace.listings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Marketplace</h1>
      <MarketplaceAdminPanel initialChannels={channels} initialListings={listings} />
    </div>
  );
}
