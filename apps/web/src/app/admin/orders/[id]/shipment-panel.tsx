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
  initialShipments: Shipment[];
}

type ShipmentFormState = {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  isSubmitting: boolean;
  error: string | null;
};

type ShipmentFormAction =
  | {
      type: 'set_field';
      field: 'carrier' | 'trackingNumber' | 'trackingUrl';
      value: string;
    }
  | { type: 'submit_start' }
  | { type: 'submit_success' }
  | { type: 'submit_error'; message: string };

const initialFormState: ShipmentFormState = {
  carrier: 'Servientrega',
  trackingNumber: '',
  trackingUrl: '',
  isSubmitting: false,
  error: null,
};

function shipmentFormReducer(
  state: ShipmentFormState,
  action: ShipmentFormAction,
): ShipmentFormState {
  switch (action.type) {
    case 'set_field':
      return { ...state, [action.field]: action.value };
    case 'submit_start':
      return { ...state, isSubmitting: true, error: null };
    case 'submit_success':
      return {
        ...state,
        isSubmitting: false,
        trackingNumber: '',
        trackingUrl: '',
      };
    case 'submit_error':
      return { ...state, isSubmitting: false, error: action.message };
    default:
      return state;
  }
}

export function ShipmentPanel({ orderId, initialShipments }: ShipmentPanelProps) {
  const router = useRouter();
  const api = useApiClient();
  const [form, dispatch] = React.useReducer(shipmentFormReducer, initialFormState);

  async function handleCreateShipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: 'submit_start' });
    try {
      await api.fulfillment.createShipment(orderId, {
        carrier: form.carrier,
        trackingNumber: form.trackingNumber || undefined,
        trackingUrl: form.trackingUrl || undefined,
      });
      dispatch({ type: 'submit_success' });
      router.refresh();
    } catch (err) {
      dispatch({
        type: 'submit_error',
        message: err instanceof Error ? err.message : 'No se pudo crear el envío.',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fulfillment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {initialShipments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {initialShipments.map((shipment) => (
              <div key={shipment.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{shipment.carrier}</p>
                <p className="text-muted-foreground">
                  {shipment.trackingNumber ?? 'Sin guía'} · {shipment.status}
                </p>
                {shipment.items?.length ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {shipment.items.length} línea(s) en este envío
                  </p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  {shipment.labelUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(shipment.labelUrl!, '_blank')}
                    >
                      Imprimir etiqueta
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void api.fulfillment
                        .markDelivered(shipment.id)
                        .then(() => router.refresh())
                    }
                  >
                    Marcar entregado
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay envíos registrados.</p>
        )}

        <form onSubmit={handleCreateShipment} className="flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor="carrier">Transportista</Label>
            <Input
              id="carrier"
              value={form.carrier}
              onChange={(e) =>
                dispatch({ type: 'set_field', field: 'carrier', value: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trackingNumber">Número de guía</Label>
            <Input
              id="trackingNumber"
              value={form.trackingNumber}
              onChange={(e) =>
                dispatch({
                  type: 'set_field',
                  field: 'trackingNumber',
                  value: e.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trackingUrl">URL de rastreo</Label>
            <Input
              id="trackingUrl"
              value={form.trackingUrl}
              onChange={(e) =>
                dispatch({ type: 'set_field', field: 'trackingUrl', value: e.target.value })
              }
            />
          </div>
          {form.error ? <p className="text-sm text-red-600">{form.error}</p> : null}
          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? 'Creando envío...' : 'Crear envío'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
