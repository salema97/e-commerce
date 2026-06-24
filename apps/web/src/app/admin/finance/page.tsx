import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';

export default function AdminFinancePage() {
  return (
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={<h1 className="text-2xl font-bold">Finanzas</h1>}
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
