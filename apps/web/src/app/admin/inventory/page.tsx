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
  const api = getServerApiClient();
  const inventory = await api.inventory.findAll().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Link href="/admin/inventory/new">
          <Button>Add stock</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product ID</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <Button variant="outline" size="sm">Edit</Button>
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
