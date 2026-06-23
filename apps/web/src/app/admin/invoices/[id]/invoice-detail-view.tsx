'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceStatusBadge } from '@/components/admin/invoices/invoice-status-badge';
import { InvoiceActions } from '@/components/admin/invoices/invoice-actions';
import { formatDateTime, formatPrice } from '@repo/shared-utils';

interface InvoiceDetailViewProps {
  id: string;
}

export function InvoiceDetailView({ id }: InvoiceDetailViewProps) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const invoiceQuery = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => api.invoices.findOne(id),
    refetchInterval: 15_000,
  });

  const orderQuery = useQuery({
    queryKey: ['orders', invoiceQuery.data?.orderId],
    queryFn: () => api.orders.findOne(invoiceQuery.data!.orderId),
    enabled: Boolean(invoiceQuery.data?.orderId),
  });

  const invoice = invoiceQuery.data;
  const order = orderQuery.data;

  function handleRetry() {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['invoices', id] });
  }

  if (invoiceQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Factura no encontrada</h1>
        <Link href="/admin/invoices">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  const showError = invoice.status === 'FAILED' || invoice.status === 'REJECTED';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Factura SRI</h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <Link href="/admin/invoices">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      {showError ? (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">La emisión de esta factura falló o fue rechazada por el SRI.</p>
          <p>
            Revisa la información e intenta reenviarla. Si el problema persiste, contacta al
            administrador del sistema.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del documento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Clave de acceso</span>
                <span className="break-all font-mono text-sm">{invoice.accessKey}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Número de autorización</span>
                <span className="font-mono text-sm">{invoice.authorizationNumber ?? 'Pendiente'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Tipo de documento</span>
                <span className="text-sm">{invoice.documentType === '01' ? 'Factura' : invoice.documentType}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Creada</span>
                <span className="text-sm">{formatDateTime(invoice.createdAt)}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Última actualización</span>
                <span className="text-sm">{formatDateTime(invoice.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Orden asociada</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {orderQuery.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : order ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Orden</span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cliente</span>
                    <span>{order.customerEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{formatPrice(order.total)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No se pudo cargar la orden.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceActions
                id={invoice.id}
                status={invoice.status}
                onRetry={handleRetry}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
