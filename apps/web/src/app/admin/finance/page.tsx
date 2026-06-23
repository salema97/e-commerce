import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    href: '/admin/finance/incomes',
    title: 'Ingresos',
    description: 'Registrar y consultar ingresos por pedido, inversión u otros.',
  },
  {
    href: '/admin/finance/expenses',
    title: 'Gastos',
    description: 'Control de gastos, estados y comprobantes adjuntos.',
  },
  {
    href: '/admin/finance/categories',
    title: 'Categorías de gasto',
    description: 'Clasificación contable de egresos.',
  },
  {
    href: '/admin/finance/suppliers',
    title: 'Proveedores',
    description: 'Directorio de proveedores vinculados a gastos.',
  },
  {
    href: '/admin/finance/reports',
    title: 'Reportes',
    description: 'Flujo de caja, crédito de tienda y resumen financiero.',
  },
];

export default function AdminFinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <p className="text-muted-foreground">
          Módulo financiero: ingresos, gastos, proveedores y reportes.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
