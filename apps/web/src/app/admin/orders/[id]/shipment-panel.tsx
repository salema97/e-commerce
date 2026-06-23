'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import type { Shipment } from '@repo/shared-types';

interface ShipmentPanelProps {
  orderId: string;
}

export function ShipmentPanel({ orderId }: ShipmentPanelProps) {
  const router = useRouter();
  const api = useApiClient();
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [carrier, setCarrier] = React.useState('Servientrega');
  const [trackingNumber, setTrackingNumber] = React.useState('');
  const [trackingUrl, setTrackingUrl] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void api.fulfillment.listShipments(orderId).then(setShipments).catch(() => undefined);
  }, [api, orderId]);

  async function handleCreateShipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const shipment = await api.fulfillment.createShipment(orderId, {
        carrier,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
      });
      setShipments((current) => [...current, shipment]);
      setTrackingNumber('');
      setTrackingUrl('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el envío.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fulfillment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {shipments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{shipment.carrier}</p>
                <p className="text-muted-foreground">
                  {shipment.trackingNumber ?? 'Sin guía'} · {shipment.status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay envíos registrados.</p>
        )}

        <form onSubmit={handleCreateShipment} className="flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor="carrier">Transportista</Label>
            <Input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trackingNumber">Número de guía</Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trackingUrl">URL de rastreo</Label>
            <Input
              id="trackingUrl"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando envío...' : 'Crear envío'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
