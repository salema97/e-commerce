import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminCategoriesTable } from '@/components/admin/admin-categories-table';

export default async function AdminCategoriesPage() {
  const api = await getServerApiClient();
  const categories = await api.categories.findAll().catch(() => []);

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Categorías"
          subtitle="Organización del catálogo"
          showNetworkStatus={false}
          actions={
            <Link href="/admin/categories/new">
              <Button className="font-anton text-lg uppercase">Agregar categoría</Button>
            </Link>
          }
        />
      }
    >
      <AdminCategoriesTable categories={categories} />
    </AnimatedPageShell>
  );
}
