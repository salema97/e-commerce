import { getServerApiClient } from '@/lib/api';
import { requireMarketingAccess } from '@/lib/marketing-page';
import { MarketingCampaignsView } from './marketing-campaigns-view';
import type { Promotion } from '@repo/shared-types';

export default async function AdminMarketingPage() {
  await requireMarketingAccess('/admin/marketing');
  const api = await getServerApiClient();
  const initialPromotions = await api.marketing
    .listPromotions()
    .catch(() => [] as Array<Pick<Promotion, 'id' | 'name'>>);

  return <MarketingCampaignsView initialPromotions={initialPromotions} />;
}
