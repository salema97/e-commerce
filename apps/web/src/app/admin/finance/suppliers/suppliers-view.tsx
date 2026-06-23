'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/client-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export function SuppliersView() {
  const api = useApiClient();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.suppliers.findAll(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/finance" className="underline">
            Finanzas
          </Link>
          {' / Proveedores'}
        </p>
      </div>

      {suppliersQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(suppliersQuery.data ?? []).map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contactName ?? '—'}</TableCell>
                <TableCell>{supplier.email ?? '—'}</TableCell>
                <TableCell>{supplier.phone ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
