import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminInventoryTable } from '@/components/admin/admin-inventory-table';

export default async function AdminInventoryPage() {
  const api = await getServerApiClient();
  const inventory = await api.inventory.findAll().catch(() => []);

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Inventario"
          subtitle="Stock y reservas"
          showNetworkStatus={false}
          actions={
            <Link href="/admin/inventory/new">
              <Button className="font-anton text-lg uppercase">Agregar stock</Button>
            </Link>
          }
        />
      }
    >
      <AdminInventoryTable inventory={inventory} />
    </AnimatedPageShell>
  );
}
