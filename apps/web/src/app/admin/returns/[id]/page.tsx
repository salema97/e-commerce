import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import ReturnDetail from './return-detail';

interface AdminReturnDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReturnDetailPage({ params }: AdminReturnDetailPageProps) {
  const { id } = await params;
  const api = await getServerApiClient();

  try {
    const returnRequest = await api.returns.findOne(id);
    return <ReturnDetail returnRequest={returnRequest} />;
  } catch {
    notFound();
  }
}
