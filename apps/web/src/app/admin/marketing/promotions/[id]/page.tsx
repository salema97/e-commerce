import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { requireMarketingAccess } from '@/lib/marketing-page';
import { PromotionDetailView } from './promotion-detail-view';
import type { Promotion } from '@repo/shared-types';

interface PromotionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromotionDetailPage({ params }: PromotionDetailPageProps) {
  const { id } = await params;
  await requireMarketingAccess(`/admin/marketing/promotions/${id}`);
  const api = await getServerApiClient();
  const promotion = await api.promotions.findOne(id).catch(() => null);

  if (!promotion) {
    notFound();
  }

  return <PromotionDetailView initialPromotion={promotion as Promotion} />;
}
