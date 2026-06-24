'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Supplier } from '@repo/shared-types';

export function SuppliersView({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const api = useApiClient();
  const authReady = useAuthApiReady();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.suppliers.findAll(),
    initialData: initialSuppliers,
    enabled: authReady,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Proveedores"
        subtitle="Finanzas / Proveedores"
        showNetworkStatus={false}
      />

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
    </div>
  );
}
