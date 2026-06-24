import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import OrderDetail from './order-detail';

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);
  const order = await api.orders.findOne(id).catch(() => null);

  if (!order) {
    notFound();
  }

  return <OrderDetail order={order} />;
}
