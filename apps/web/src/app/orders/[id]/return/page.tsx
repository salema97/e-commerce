import { notFound, redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import ReturnRequestForm from './return-request-form';

interface ReturnRequestPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReturnRequestPage({ params }: ReturnRequestPageProps) {
  const session = await getSession();
  const isAuthenticated = Boolean(session);

  const { id } = await params;
  const api = await getServerApiClient();

  let order;
  try {
    order = await api.orders.findOne(id);
  } catch {
    notFound();
  }

  const isDelivered = order.status === 'DELIVERED';
  const createdAt = new Date(order.createdAt);
  const windowDays = 30;
  const isWithinWindow = createdAt.getTime() + windowDays * 24 * 60 * 60 * 1000 >= Date.now();

  if (!isDelivered || !isWithinWindow) {
    redirect(`/orders/${id}`);
  }

  return <ReturnRequestForm order={order} isGuest={!isAuthenticated} />;
}
