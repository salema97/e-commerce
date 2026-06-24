import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { MarketingCampaignsView } from './marketing-campaigns-view';
import type { Promotion } from '@repo/shared-types';

export default async function AdminMarketingPage() {
  const session = await getCurrentUser();

  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/marketing');
  }

  const api = await getServerApiClient();
  const initialPromotions = await api.marketing
    .listPromotions()
    .catch(() => [] as Array<Pick<Promotion, 'id' | 'name'>>);

  return <MarketingCampaignsView initialPromotions={initialPromotions} />;
}
