import { getServerApiClient } from '@/lib/api';
import { requireMarketingAccess } from '@/lib/marketing-page';
import { PlacementsListView } from './placements-list-view';
import type { MarketingPlacement } from '@repo/shared-types';

export default async function AdminPlacementsPage() {
  await requireMarketingAccess('/admin/marketing/placements');
  const api = await getServerApiClient();  const initialPlacements = await api.marketing
    .listPlacementsAdmin()
    .catch(() => [] as MarketingPlacement[]);

  return <PlacementsListView initialPlacements={initialPlacements} />;
}
