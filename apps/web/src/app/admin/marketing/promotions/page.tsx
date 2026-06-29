import { getServerApiClient } from '@/lib/api';
import { requireMarketingAccess } from '@/lib/marketing-page';
import { PromotionsListView } from './promotions-list-view';
import type { Promotion } from '@repo/shared-types';

export default async function AdminPromotionsPage() {
  await requireMarketingAccess('/admin/marketing/promotions');
  const api = await getServerApiClient();
  const initialPromotions = await api.promotions.findAll().catch(() => [] as Promotion[]);

  return <PromotionsListView initialPromotions={initialPromotions} />;
}
