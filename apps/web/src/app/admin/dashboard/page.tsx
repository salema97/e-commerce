import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@repo/shared-utils';

export default async function AdminDashboardPage() {
  const api = await getServerApiClient();

  const [products, orders, users] = await Promise.allSettled([
    api.products.findAll(),
    api.orders.findAll({ limit: 1 }),
    api.users.findAll(),
  ]);

  const productCount = products.status === 'fulfilled' ? products.value.length : 0;
  const orderCount = orders.status === 'fulfilled' ? orders.value.meta.total : 0;
  const userCount = users.status === 'fulfilled' ? users.value.length : 0;

  const totalRevenue =
    orders.status === 'fulfilled'
      ? orders.value.data.reduce((sum: number, order) => sum + order.total, 0)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Revenue" value={formatPrice(totalRevenue)} />
        <MetricCard title="Orders" value={String(orderCount)} />
        <MetricCard title="Products" value={String(productCount)} />
        <MetricCard title="Customers" value={String(userCount)} />
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
