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
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';

export default async function AdminCategoriesPage() {
  const api = await getServerApiClient();
  const categories = await api.categories.findAll().catch(() => []);

  return (
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={
        <div className="flex items-center justify-between">
          <h1 className="neo-page-title">Categorías</h1>
          <Link href="/admin/categories/new">
            <Button>Agregar categoría</Button>
          </Link>
        </div>
      }
    >
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>URL amigable</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/categories/${category.id}`}>
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
