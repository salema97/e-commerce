import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminProductsTable } from '@/components/admin/admin-products-table';

export default async function AdminProductsPage() {
  const api = await getServerApiClient();
  const products = await api.products.findAll().catch(() => []);

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Productos"
          subtitle="Catálogo y publicación"
          showNetworkStatus={false}
          actions={
            <div className="flex gap-2">
              <Link href="/admin/products/import">
                <Button variant="outline" className="font-anton text-lg uppercase">
                  Importar CSV
                </Button>
              </Link>
              <Link href="/admin/products/new">
                <Button className="font-anton text-lg uppercase">Agregar producto</Button>
              </Link>
            </div>
          }
        />
      }
    >
      <AdminProductsTable products={products} />
    </AnimatedPageShell>
  );
}
