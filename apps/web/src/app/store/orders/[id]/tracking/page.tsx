'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/lib/client-api';
import { orderStatusLabel } from '@repo/shared-utils';
import type { OrderTracking } from '@repo/shared-types';

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const api = useApiClient();
  const [tracking, setTracking] = React.useState<OrderTracking | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void api.orders
      .getTracking(params.id)
      .then((result) => {
        if (!cancelled) setTracking(result);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el seguimiento del pedido.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, params.id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-16">Cargando seguimiento...</div>;
  }

  if (error || !tracking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{error ?? 'Pedido no encontrado.'}</p>
        <Button className="mt-6" onClick={() => window.location.assign('/store')}>
          Volver a la tienda
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento del pedido</h1>
          <p className="mt-2 text-muted-foreground">{tracking.orderNumber}</p>
        </div>
        <Badge variant="outline">{orderStatusLabel(tracking.status)}</Badge>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Envíos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {tracking.shipments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay envíos registrados para este pedido.
            </p>
          ) : (
            tracking.shipments.map((shipment) => (
              <div key={shipment.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{shipment.carrier}</p>
                    <p className="text-sm text-muted-foreground">
                      Guía: {shipment.trackingNumber ?? 'Pendiente'}
                    </p>
                  </div>
                  <Badge variant="secondary">{shipment.status}</Badge>
                </div>
                {shipment.trackingUrl ? (
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Rastrear paquete
                  </a>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
