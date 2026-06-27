import { notFound, redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import ReturnRequestForm from './return-request-form';

interface ReturnRequestPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function ReturnRequestPage({
  params,
  searchParams,
}: ReturnRequestPageProps) {
  const [session, { id }, { email: guestEmail }, api] = await Promise.all([
    getSession(),
    params,
    searchParams,
    getServerApiClient(),
  ]);
  const isAuthenticated = Boolean(session);

  const order = isAuthenticated
    ? await api.orders.findOne(id).catch(() => null)
    : guestEmail
      ? await api.orders.findOne(id, { guestEmail }).catch(() => null)
      : null;

  if (!order) {
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
