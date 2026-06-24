import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import OrderDetail from './order-detail';

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const api = await getServerApiClient();

  try {
    const order = await api.orders.findOne(id);
    return <OrderDetail order={order} />;
  } catch {
    notFound();
  }
}
