import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import type { Shipment } from '@repo/shared-types';
import OrderDetail from './order-detail';

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);
  const [order, initialShipments] = await Promise.all([
    api.orders.findOne(id).catch(() => null),
    api.fulfillment.listShipments(id).catch(() => [] as Shipment[]),
  ]);

  if (!order) {
    notFound();
  }

  return <OrderDetail order={order} initialShipments={initialShipments} />;
}
