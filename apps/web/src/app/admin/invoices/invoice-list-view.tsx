'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InvoiceFilters, InvoiceFiltersState } from '@/components/admin/invoices/invoice-filters';
import { InvoiceStatusBadge } from '@/components/admin/invoices/invoice-status-badge';
import { InvoiceActions } from '@/components/admin/invoices/invoice-actions';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDateTime } from '@repo/shared-utils';
import type { InvoiceResponseDto, InvoiceStatus } from '@repo/shared-types';

const LIMIT = 20;

function matchesSearch(invoice: InvoiceResponseDto, search: string): boolean {
  if (!search) return true;
  const term = search.toLowerCase();
  return (
    invoice.accessKey.toLowerCase().includes(term) ||
    invoice.orderId.toLowerCase().includes(term)
  );
}

export function InvoiceListView({ initialInvoices }: { initialInvoices: InvoiceResponseDto[] }) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<InvoiceFiltersState>({
    search: '',
    status: '',
    from: '',
    to: '',
  });
  const [offset, setOffset] = React.useState(0);
  const [appliedFilters, setAppliedFilters] = React.useState(filters);

  const queryFilters = React.useMemo(() => {
    const result: Record<string, string | number | undefined> = {
      limit: LIMIT,
      offset,
    };
    if (appliedFilters.status) result.status = appliedFilters.status;
    if (appliedFilters.from) result.from = appliedFilters.from;
    if (appliedFilters.to) result.to = appliedFilters.to;
    // orderId exact search is only sent when the value looks like an ID.
    if (appliedFilters.search.startsWith('ord_')) {
      result.orderId = appliedFilters.search;
    }
    return result;
  }, [appliedFilters, offset]);

  const { data: invoices, isError: invoicesError } = useQuery({
    queryKey: ['invoices', queryFilters],
    queryFn: () =>
      api.invoices.findAll(queryFilters as {
        status?: InvoiceStatus;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
        orderId?: string;
      }),
    initialData: offset === 0 && !appliedFilters.status && !appliedFilters.from && !appliedFilters.to && !appliedFilters.search
      ? initialInvoices
      : undefined,
    enabled: authReady,
    refetchInterval: 15_000,
  });

  const filteredInvoices = React.useMemo(() => {
    const list = invoices ?? [];
    if (!appliedFilters.search || appliedFilters.search.startsWith('ord_')) {
      return list;
    }
    return list.filter((invoice) => matchesSearch(invoice, appliedFilters.search));
  }, [invoices, appliedFilters.search]);

  function handleApplyFilters() {
    setOffset(0);
    setAppliedFilters(filters);
  }

  function handleRetry() {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  }

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Facturación"
          subtitle="Comprobantes electrónicos SRI"
          showNetworkStatus={false}
          actions={
            <Link href="/admin/invoices/credit-notes" className={buttonVariants({ variant: 'outline' })}>
              Notas de crédito
            </Link>
          }
        />
      }
    >
      <InvoiceFilters
        filters={filters}
        onFilterChange={(changes) => setFilters((prev) => ({ ...prev, ...changes }))}
        onSearch={handleApplyFilters}
      />

      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave de acceso</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoicesError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-destructive">
                  No se pudieron cargar las facturas. Recarga la página o vuelve a iniciar sesión.
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron facturas.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.accessKey.slice(0, 20)}…
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${invoice.orderId}`}
                      className="font-bold uppercase text-neo-onyx underline-offset-4 hover:bg-neo-gold hover:underline"
                    >
                      {invoice.orderId.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">No disponible</TableCell>
                  <TableCell className="text-muted-foreground">No disponible</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell>{formatDateTime(invoice.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <InvoiceActions
                        id={invoice.id}
                        status={invoice.status}
                        onRetry={handleRetry}
                      />
                      <Link href={`/admin/invoices/${invoice.id}`}>
                        <Button variant="outline" size="sm">Ver</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={offset === 0}
          onClick={() => setOffset((prev) => Math.max(0, prev - LIMIT))}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {Math.floor(offset / LIMIT) + 1}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={filteredInvoices.length < LIMIT}
          onClick={() => setOffset((prev) => prev + LIMIT)}
        >
          Siguiente
        </Button>
      </div>
    </AnimatedPageShell>
  );
}
