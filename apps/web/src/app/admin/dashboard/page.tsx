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
    <div className="flex flex-col gap-10">
      <header className="border-b-[6px] border-neo-onyx pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Administración</p>
        <h1 className="font-anton text-5xl uppercase md:text-7xl">Panel</h1>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Ingresos (muestra)" value={formatPrice(totalRevenue)} accent />
        <MetricCard title="Pedidos" value={String(orderCount)} />
        <MetricCard title="Productos" value={String(productCount)} />
        <MetricCard title="Clientes" value={String(userCount)} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  accent = false,
}: {
  title: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? 'bg-neo-gold' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-anton text-4xl">{value}</p>
      </CardContent>
    </Card>
  );
}
