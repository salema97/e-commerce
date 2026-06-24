import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminFinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Finanzas</h1>
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
    </div>
  );
}
