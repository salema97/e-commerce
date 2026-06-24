import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@repo/shared-utils';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default async function AdminAnalyticsPage() {
  const api = await getServerApiClient();

  const [overview, funnel, cohorts] = await Promise.allSettled([
    api.analytics.getOverview(30),
    api.analytics.getFunnel(30),
    api.analytics.getCohorts(8),
  ]);

  const metrics = overview.status === 'fulfilled' ? overview.value : null;
  const funnelSteps = funnel.status === 'fulfilled' ? funnel.value : null;
  const cohortReport = cohorts.status === 'fulfilled' ? cohorts.value : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminPageHeader
        title="Analítica Avanzada"
        subtitle="Métricas de rendimiento de los últimos 30 días, embudos de conversión y retención."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Ingresos" value={metrics ? formatPrice((metrics as any).revenue) : '—'} />
        <MetricCard title="Pedidos Pagados" value={metrics ? String((metrics as any).paidOrders) : '—'} />
        <MetricCard
          title="Tasa de Conversión"
          value={metrics ? `${(metrics as any).conversionRate}%` : '—'}
        />
        <MetricCard title="Vistas de Producto" value={funnelSteps ? String((funnelSteps as any).product_view ?? 0) : '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="brutalist-card bg-white p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 border-b-2 border-black pb-2">Embudo Catálogo → Compra</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {funnelSteps ? (
              <>
                <FunnelStep label="Vistas Producto" value={(funnelSteps as any).product_view ?? 0} />
                <FunnelStep label="Añadido al Carrito" value={(funnelSteps as any).add_to_cart ?? 0} />
                <FunnelStep label="Inicio Pago" value={(funnelSteps as any).begin_checkout ?? 0} />
                <FunnelStep label="Compras" value={(funnelSteps as any).purchase ?? 0} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos de embudo disponibles.</p>
            )}
          </div>
        </div>

        {metrics && (metrics as any).topProducts.length > 0 ? (
          <div className="brutalist-card bg-white p-6">
            <h2 className="text-xl font-bold mb-4 border-b-2 border-black pb-2">Más Vendidos</h2>
            <div className="flex flex-col gap-3">
              {(metrics as any).topProducts.map((product: { productId: string; name: string; quantity: number }) => (
                <div key={product.productId} className="flex justify-between items-center text-sm font-medium border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <span>{product.name}</span>
                  <span className="bg-neo-gold border-2 border-black px-2 py-0.5 text-xs font-bold">{product.quantity} uds.</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {cohortReport && (cohortReport as any).cohorts.length > 0 ? (
        <div className="brutalist-card bg-white p-6">
          <h2 className="text-xl font-bold mb-4 border-b-2 border-black pb-2">Retención por Cohorte Semanal</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left text-muted-foreground font-bold">
                  <th className="py-2 pr-4 text-black">Semana cohorte</th>
                  <th className="py-2 pr-4 text-black">Clientes</th>
                  {(cohortReport as any).cohorts[0]?.retentionByWeek.map((_: any, index: number) => (
                    <th key={index} className="py-2 pr-2 text-black">
                      Semana {index}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(cohortReport as any).cohorts.map((cohort: any) => (
                  <tr key={cohort.cohortWeek} className="border-b border-black last:border-0">
                    <td className="py-3 pr-4 font-bold">{cohort.cohortWeek}</td>
                    <td className="py-3 pr-4">{cohort.cohortSize}</td>
                    {cohort.retentionByWeek.map((rate: number, index: number) => (
                      <td key={index} className="py-3 pr-2 font-medium">
                        {rate}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
