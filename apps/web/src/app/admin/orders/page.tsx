import { getServerApiClient } from '@/lib/api';
import { OrdersKanban } from '@/components/admin/orders-kanban';

export default async function AdminOrdersPage() {
  const api = await getServerApiClient();
  const result = await api.orders.findAll({ limit: 50 }).catch(() => ({
    data: [],
    meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
  }));

  const totalRevenue = result.data.reduce((sum, order) => sum + order.total, 0);

  return <OrdersKanban orders={result.data} totalRevenue={totalRevenue} />;
}
