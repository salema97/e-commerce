import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default function AdminFinancePage() {
  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Finanzas"
          subtitle="Ingresos, gastos e informes"
          showNetworkStatus={false}
        />
      }
    >
      <NeoReveal>
        <Card>
        <CardHeader>
          <CardTitle>Módulo financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Panel financiero en desarrollo. Los ingresos, gastos, proveedores e
            informes de flujo de caja se implementarán en la Fase 8.
          </p>
        </CardContent>
      </Card>
      </NeoReveal>
    </AnimatedPageShell>
  );
}
