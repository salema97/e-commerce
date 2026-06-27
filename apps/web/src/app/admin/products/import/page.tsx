import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { ProductsImportPanel } from './products-import-panel';

export default function AdminProductsImportPage() {
  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Importar productos"
          subtitle="Carga masiva CSV con errores por fila"
          showNetworkStatus={false}
        />
      }
    >
      <ProductsImportPanel />
    </AnimatedPageShell>
  );
}
