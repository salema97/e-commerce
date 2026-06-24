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
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@repo/shared-utils';

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

export default async function AdminProductsPage() {
  const api = await getServerApiClient();
  const products = await api.products.findAll().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="neo-page-title">Productos</h1>
        <Link href="/admin/products/new">
          <Button>Agregar producto</Button>
        </Link>
      </div>

      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/products/${product.id}`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
