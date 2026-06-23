import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@repo/shared-utils';

export default async function AdminAnalyticsPage() {
  const api = getServerApiClient();

  const [overview, funnel, cohorts] = await Promise.allSettled([
    api.analytics.getOverview(30),
    api.analytics.getFunnel(30),
    api.analytics.getCohorts(8),
  ]);

  const metrics = overview.status === 'fulfilled' ? overview.value : null;
  const funnelSteps = funnel.status === 'fulfilled' ? funnel.value : null;
  const cohortReport = cohorts.status === 'fulfilled' ? cohorts.value : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Analítica</h1>
      <p className="text-sm text-muted-foreground">
        Métricas de los últimos 30 días (eventos en tienda + pedidos pagados).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Ingresos" value={metrics ? formatPrice(metrics.revenue) : '—'} />
        <MetricCard title="Pedidos pagados" value={metrics ? String(metrics.paidOrders) : '—'} />
        <MetricCard
          title="Tasa de conversión"
          value={metrics ? `${metrics.conversionRate}%` : '—'}
        />
        <MetricCard title="Vistas de producto" value={funnelSteps ? String(funnelSteps.product_view ?? 0) : '—'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Embudo catálogo → compra</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-4">
          {funnelSteps ? (
            <>
              <FunnelStep label="Vista producto" value={funnelSteps.product_view ?? 0} />
              <FunnelStep label="Agregar al carrito" value={funnelSteps.add_to_cart ?? 0} />
              <FunnelStep label="Inicio checkout" value={funnelSteps.begin_checkout ?? 0} />
              <FunnelStep label="Compra" value={funnelSteps.purchase ?? 0} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No hay datos de embudo disponibles.</p>
          )}
        </CardContent>
      </Card>

      {metrics && metrics.topProducts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {metrics.topProducts.map((product: { productId: string; name: string; quantity: number }) => (
              <div key={product.productId} className="flex justify-between text-sm">
                <span>{product.name}</span>
                <span className="text-muted-foreground">{product.quantity} uds.</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {cohortReport && cohortReport.cohorts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Retención por cohorte semanal</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Semana cohorte</th>
                  <th className="py-2 pr-4">Clientes</th>
                  {cohortReport.cohorts[0]?.retentionByWeek.map((_, index) => (
                    <th key={index} className="py-2 pr-2">
                      S+{index}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortReport.cohorts.map((cohort) => (
                  <tr key={cohort.cohortWeek} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{cohort.cohortWeek}</td>
                    <td className="py-2 pr-4">{cohort.cohortSize}</td>
                    {cohort.retentionByWeek.map((rate, index) => (
                      <td key={index} className="py-2 pr-2">
                        {rate}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
