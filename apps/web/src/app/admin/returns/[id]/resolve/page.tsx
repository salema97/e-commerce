import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import ReturnResolve from './return-resolve';

interface ResolveReturnPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResolveReturnPage({ params }: ResolveReturnPageProps) {
  const { id } = await params;
  const api = await getServerApiClient();

  try {
    const returnRequest = await api.returns.findOne(id);
    return <ReturnResolve returnRequest={returnRequest} />;
  } catch {
    notFound();
  }
}
