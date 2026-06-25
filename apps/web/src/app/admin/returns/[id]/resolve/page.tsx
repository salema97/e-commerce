import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import ReturnResolve from './return-resolve';

interface ResolveReturnPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResolveReturnPage({ params }: ResolveReturnPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);
  const returnRequest = await api.returns.findOne(id).catch(() => null);

  if (!returnRequest) {
    notFound();
  }

  return <ReturnResolve returnRequest={returnRequest} />;
}
