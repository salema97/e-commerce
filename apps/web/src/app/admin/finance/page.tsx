import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

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
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Finanzas"
          subtitle="Ingresos, gastos, proveedores y reportes"
          showNetworkStatus={false}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <NeoReveal key={section.href}>
            <Link href={section.href} className="block h-full">
              <Card className="h-full transition-transform hover:-translate-y-1 hover:bg-neo-gold/15">
                <CardHeader>
                  <CardTitle className="text-lg uppercase">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          </NeoReveal>
        ))}
      </div>
    </AnimatedPageShell>
  );
}
