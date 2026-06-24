'use client';

import * as React from 'react';
import { useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatPrice } from '@repo/shared-utils';
import type {
  AnalyticsOverviewReport,
  CohortRetentionReport,
} from '@repo/shared-types';

const OVERVIEW_DAYS = 30;
const COHORT_WEEKS = 8;

interface AnalyticsViewProps {
  initialOverview: AnalyticsOverviewReport | null;
  initialFunnel: Record<string, number> | null;
  initialCohorts: CohortRetentionReport | null;
}

export function AnalyticsView({
  initialOverview,
  initialFunnel,
  initialCohorts,
}: AnalyticsViewProps) {
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();

  const { data: metrics } = hooks.useAnalyticsOverview(OVERVIEW_DAYS, {
    enabled: authReady,
    initialData: initialOverview ?? undefined,
    refetchInterval: 30_000,
  });

  const { data: funnelSteps } = hooks.useAnalyticsFunnel(OVERVIEW_DAYS, {
    enabled: authReady,
    initialData: initialFunnel ?? undefined,
    refetchInterval: 30_000,
  });

  const { data: cohortReport } = hooks.useAnalyticsCohorts(COHORT_WEEKS, {
    enabled: authReady,
    initialData: initialCohorts ?? undefined,
    refetchInterval: 60_000,
  });

  return (
    <AnimatedPageShell className="flex flex-col gap-6">
      <AdminPageHeader
        title="Analítica avanzada"
        subtitle="Métricas de los últimos 30 días, embudo de conversión y retención por cohorte."
        showNetworkStatus
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Ingresos" value={metrics ? formatPrice(metrics.revenue) : '—'} />
        <MetricCard title="Pedidos pagados" value={metrics ? String(metrics.paidOrders) : '—'} />
        <MetricCard
          title="Tasa de conversión"
          value={metrics ? `${metrics.conversionRate}%` : '—'}
        />
        <MetricCard
          title="Vistas de producto"
          value={funnelSteps ? String(funnelSteps.product_view ?? 0) : '—'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="neo-panel bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 border-b-[3px] border-neo-onyx pb-2 text-lg font-bold uppercase">
            Embudo catálogo → compra
          </h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {funnelSteps ? (
              <>
                <FunnelStep label="Vistas producto" value={funnelSteps.product_view ?? 0} />
                <FunnelStep label="Añadido al carrito" value={funnelSteps.add_to_cart ?? 0} />
                <FunnelStep label="Inicio pago" value={funnelSteps.begin_checkout ?? 0} />
                <FunnelStep label="Compras" value={funnelSteps.purchase ?? 0} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos de embudo disponibles.</p>
            )}
          </div>
        </section>

        {metrics && metrics.topProducts.length > 0 ? (
          <section className="neo-panel bg-white p-6">
            <h2 className="mb-4 border-b-[3px] border-neo-onyx pb-2 text-lg font-bold uppercase">
              Más vendidos
            </h2>
            <ul className="flex flex-col gap-3">
              {metrics.topProducts.map((product) => (
                <li
                  key={product.productId}
                  className="flex items-center justify-between border-b border-neo-onyx/10 pb-2 text-sm font-medium last:border-0 last:pb-0"
                >
                  <span>{product.name}</span>
                  <span className="border-[2px] border-neo-onyx bg-neo-gold px-2 py-0.5 text-xs font-bold">
                    {product.quantity} uds.
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {cohortReport && cohortReport.cohorts.length > 0 ? (
        <section className="neo-panel overflow-x-auto bg-white p-6">
          <h2 className="mb-4 border-b-[3px] border-neo-onyx pb-2 text-lg font-bold uppercase">
            Retención por cohorte semanal
          </h2>
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b-[3px] border-neo-onyx text-left font-bold text-muted-foreground">
                <th className="py-2 pr-4 text-neo-onyx">Semana cohorte</th>
                <th className="py-2 pr-4 text-neo-onyx">Clientes</th>
                {cohortReport.cohorts[0]?.retentionByWeek.map((_, weekIndex) => (
                  <th key={`retention-week-${weekIndex}`} className="py-2 pr-2 text-neo-onyx">
                    Semana {weekIndex}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortReport.cohorts.map((cohort) => (
                <tr key={cohort.cohortWeek} className="border-b border-neo-onyx/20 last:border-0">
                  <td className="py-3 pr-4 font-bold">{cohort.cohortWeek}</td>
                  <td className="py-3 pr-4">{cohort.cohortSize}</td>
                  {cohort.retentionByWeek.map((rate, weekIndex) => (
                    <td key={`${cohort.cohortWeek}-w${weekIndex}`} className="py-3 pr-2 font-medium">
                      {rate}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </AnimatedPageShell>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="neo-panel bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-neo-onyx">{value}</p>
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-[3px] border-neo-onyx bg-neo-lace p-3 shadow-[4px_4px_0_0_#111111]">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-neo-onyx">{value}</p>
    </div>
  );
}
