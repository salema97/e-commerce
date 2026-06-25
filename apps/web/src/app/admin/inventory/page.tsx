import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

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
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Reservado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {typeof item.product === 'object' && item.product !== null
                    ? (item.product as { name?: string }).name ?? item.productId
                    : item.productId}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.reservedQuantity ?? 0}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/inventory/${item.id}`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </AnimatedPageShell>
  );
}
