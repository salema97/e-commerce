import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import ReturnDetail from './return-detail';

interface AdminReturnDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReturnDetailPage({ params }: AdminReturnDetailPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);
  const returnRequest = await api.returns.findOne(id).catch(() => null);

  if (!returnRequest) {
    notFound();
  }

  return <ReturnDetail returnRequest={returnRequest} />;
}
