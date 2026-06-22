import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getServerApiClient } from '@/lib/api';
import ReturnRequestForm from './return-request-form';

interface ReturnRequestPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReturnRequestPage({ params }: ReturnRequestPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/orders');
  }

  const { id } = await params;
  const api = getServerApiClient();

  let order;
  try {
    order = await api.orders.findOne(id);
  } catch {
    notFound();
  }

  if (order.status !== 'DELIVERED') {
    redirect(`/orders/${id}`);
  }

  const deliveredAt = new Date(order.createdAt);
  const windowDays = 30;
  if (deliveredAt.getTime() + windowDays * 24 * 60 * 60 * 1000 < Date.now()) {
    redirect(`/orders/${id}`);
  }

  return <ReturnRequestForm order={order} />;
}
