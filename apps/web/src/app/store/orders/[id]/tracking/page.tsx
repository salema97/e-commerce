import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { OrderTrackingView } from './order-tracking-view';

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);
  const tracking = await api.orders.getTracking(id).catch(() => null);

  if (!tracking) {
    notFound();
  }

  return <OrderTrackingView tracking={tracking} />;
}
