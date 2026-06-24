'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InvoiceStatusBadge } from '@/components/admin/invoices/invoice-status-badge';
import { InvoiceActions } from '@/components/admin/invoices/invoice-actions';
import { formatDateTime } from '@repo/shared-utils';
import type { CreditNoteResponse } from '@repo/shared-types';

export function CreditNotesView({
  initialCreditNotes,
}: {
  initialCreditNotes: CreditNoteResponse[];
}) {
  const api = useApiClient();
  const authReady = useAuthApiReady();

  const { data: creditNotes = [], refetch: refetchCreditNotes } = useQuery({
    queryKey: ['credit-notes', { limit: 20, offset: 0 }],
    queryFn: () => api.creditNotes.findAll({ limit: 20, offset: 0 }),
    initialData: initialCreditNotes,
    enabled: authReady,
    refetchInterval: 15_000,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Notas de crédito"
        subtitle="Facturación / Notas de crédito SRI"
        showNetworkStatus={false}
        actions={
          <Link href="/admin/invoices" className={buttonVariants({ variant: 'outline' })}>
            Ver facturas
          </Link>
        }
      />

      <div className="neo-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave de acceso</TableHead>
              <TableHead>Devolución</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creditNotes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="max-w-[200px] truncate font-mono text-xs">
                  {note.accessKey}
                </TableCell>
                <TableCell>{note.returnRequestId?.slice(0, 8) ?? '—'}</TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={note.status} />
                </TableCell>
                <TableCell>${Number(note.totalAmount).toFixed(2)}</TableCell>
                <TableCell>{formatDateTime(note.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <InvoiceActions
                    id={note.id}
                    documentType="credit-note"
                    status={note.status}
                    onRetry={() => void refetchCreditNotes()}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
