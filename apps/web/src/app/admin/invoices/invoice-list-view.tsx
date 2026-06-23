'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceFilters, InvoiceFiltersState } from '@/components/admin/invoices/invoice-filters';
import { InvoiceStatusBadge } from '@/components/admin/invoices/invoice-status-badge';
import { InvoiceActions } from '@/components/admin/invoices/invoice-actions';
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

export function InvoiceListView() {
  const api = useApiClient();
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

  const invoicesQuery = useQuery({
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
    refetchInterval: 15_000,
  });

  const filteredInvoices = React.useMemo(() => {
    const invoices = invoicesQuery.data ?? [];
    if (!appliedFilters.search || appliedFilters.search.startsWith('ord_')) {
      return invoices;
    }
    return invoices.filter((invoice) => matchesSearch(invoice, appliedFilters.search));
  }, [invoicesQuery.data, appliedFilters.search]);

  function handleApplyFilters() {
    setOffset(0);
    setAppliedFilters(filters);
  }

  function handleRetry() {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Facturación</h1>

      <InvoiceFilters
        filters={filters}
        onFilterChange={(changes) => setFilters((prev) => ({ ...prev, ...changes }))}
        onSearch={handleApplyFilters}
      />

      <div className="rounded-md border">
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
            {invoicesQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
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
                      className="text-primary hover:underline"
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
      </div>

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
    </div>
  );
}
