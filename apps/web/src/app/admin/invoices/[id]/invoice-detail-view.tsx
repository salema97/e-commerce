'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { AlertDescription } from '@/components/ui/alert-description';
import { AlertTitle } from '@/components/ui/alert-title';
import { InvoiceStatusBadge } from '@/components/admin/invoices/invoice-status-badge';
import { InvoiceActions } from '@/components/admin/invoices/invoice-actions';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { formatDateTime, formatPrice } from '@repo/shared-utils';
import type { InvoiceResponseDto, Order } from '@repo/shared-types';

interface InvoiceDetailViewProps {
  id: string;
  initialInvoice: InvoiceResponseDto;
  initialOrder: Order | null;
}

export function InvoiceDetailView({ id, initialInvoice, initialOrder }: InvoiceDetailViewProps) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();

  const { data: invoice } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => api.invoices.findOne(id),
    initialData: initialInvoice,
    enabled: authReady,
    refetchInterval: 15_000,
  });

  const { data: order } = useQuery({
    queryKey: ['orders', invoice?.orderId],
    queryFn: () => api.orders.findOne(invoice!.orderId),
    initialData: initialOrder ?? undefined,
    enabled: authReady && Boolean(invoice?.orderId),
  });

  function handleRetry() {
    void queryClient.invalidateQueries({ queryKey: ['invoices'] });
    void queryClient.invalidateQueries({ queryKey: ['invoices', id] });
  }

  if (!invoice) {
    return (
      <AnimatedPageShell
        className="flex flex-col gap-4"
        header={<h1 className="neo-page-title">Factura no encontrada</h1>}
      >
        <Link href="/admin/invoices">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </AnimatedPageShell>
    );
  }

  const showError = invoice.status === 'FAILED' || invoice.status === 'REJECTED';

  return (
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="neo-page-title">Factura SRI</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <Link href="/admin/invoices">
            <Button variant="outline">Volver</Button>
          </Link>
        </div>
      }
    >
      {showError ? (
        <Alert variant="destructive">
          <AlertTitle>Error de facturación SRI</AlertTitle>
          <AlertDescription>
            La emisión de esta factura falló o fue rechazada por el SRI. Revisa la información e
            intenta reenviarla. Si el problema persiste, contacta al administrador del sistema.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <NeoReveal>
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
          </NeoReveal>
        </div>

        <div className="flex flex-col gap-6">
          <NeoReveal delay={0.04}>
            <Card>
            <CardHeader>
              <CardTitle>Orden asociada</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {order ? (
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
          </NeoReveal>

          <NeoReveal delay={0.08}>
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
          </NeoReveal>
        </div>
      </div>
    </AnimatedPageShell>
  );
}
