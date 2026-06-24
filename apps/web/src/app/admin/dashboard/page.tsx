import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatPrice } from '@repo/shared-utils';

export default async function AdminDashboardPage() {
  const api = await getServerApiClient();

  const [products, orders, users] = await Promise.allSettled([
    api.products.findAll(),
    api.orders.findAll({ limit: 50 }),
    api.users.findAll(),
  ]);

  const productCount = products.status === 'fulfilled' ? products.value.length : 0;
  const orderCount = orders.status === 'fulfilled' ? orders.value.meta.total : 0;
  const userCount = users.status === 'fulfilled' ? users.value.length : 0;

  const totalRevenue =
    orders.status === 'fulfilled'
      ? orders.value.data.reduce((sum: number, order) => sum + order.total, 0)
      : 0;

  const activeOrders =
    orders.status === 'fulfilled'
      ? orders.value.data.filter((order) =>
          ['PENDING', 'PAYMENT_PENDING', 'PROCESSING', 'SHIPPED'].includes(order.status),
        ).length
      : 0;

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-10"
      header={
        <AdminPageHeader
          title="Panel"
          subtitle="Resumen operativo de la tienda"
          metrics={[
            { label: 'Ingresos (muestra)', value: formatPrice(totalRevenue), accent: true },
            { label: 'Pedidos activos', value: String(activeOrders) },
          ]}
        />
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Pedidos totales" value={String(orderCount)} accent />
        <MetricCard title="Productos" value={String(productCount)} />
        <MetricCard title="Clientes" value={String(userCount)} />
        <MetricCard title="Ingresos (muestra)" value={formatPrice(totalRevenue)} />
      </div>
    </AnimatedPageShell>
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
