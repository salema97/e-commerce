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

export default async function AdminInventoryPage() {
  const api = await getServerApiClient();
  const inventory = await api.inventory.findAll().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <Link href="/admin/inventory/new">
          <Button>Agregar stock</Button>
        </Link>
      </div>

      <div className="rounded-md border">
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
      </div>
    </div>
  );
}
