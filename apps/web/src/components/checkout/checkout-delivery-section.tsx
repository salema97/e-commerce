'use client';

import type { Dispatch } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StoreLocation, ShippingMethodType } from '@repo/shared-types';
import type { CheckoutAction } from './checkout-state';

interface CheckoutDeliverySectionProps {
  shippingMethod: ShippingMethodType;
  pickupLocationId: string;
  pickupLocations: StoreLocation[];
  dispatch: Dispatch<CheckoutAction>;
}

export function CheckoutDeliverySection({
  shippingMethod,
  pickupLocationId,
  pickupLocations,
  dispatch,
}: CheckoutDeliverySectionProps) {
  return (
    <Card className="brutalist-card">
      <CardHeader>
        <CardTitle>Entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant={shippingMethod === 'DELIVERY' ? 'default' : 'outline'}
            onClick={() => dispatch({ type: 'set_shipping_method', value: 'DELIVERY' })}
          >
            Envío a domicilio
          </Button>
          <Button
            type="button"
            variant={shippingMethod === 'PICKUP' ? 'default' : 'outline'}
            onClick={() => dispatch({ type: 'set_shipping_method', value: 'PICKUP' })}
            disabled={pickupLocations.length === 0}
          >
            Retiro en tienda (BOPIS)
          </Button>
        </div>
        {shippingMethod === 'PICKUP' ? (
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={pickupLocationId}
            onChange={(event) =>
              dispatch({ type: 'set_pickup_location', value: event.target.value })
            }
          >
            <option value="">Selecciona una tienda</option>
            {pickupLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} — {location.address}
              </option>
            ))}
          </select>
        ) : null}
      </CardContent>
    </Card>
  );
}
