'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientPaginatedList } from '@/components/admin/client-paginated-list';
import type { Inventory } from '@repo/shared-types';

export function AdminInventoryTable({ inventory }: { inventory: Inventory[] }) {
  return (
    <ClientPaginatedList items={inventory}>
      {(pageInventory) => (
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
            {pageInventory.map((item) => (
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
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ClientPaginatedList>
  );
}
