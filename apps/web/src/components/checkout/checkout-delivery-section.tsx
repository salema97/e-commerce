'use client';

import type { Dispatch } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
        <ToggleGroup
          type="single"
          value={shippingMethod}
          onValueChange={(value) => {
            if (value === 'DELIVERY' || value === 'PICKUP') {
              dispatch({ type: 'set_shipping_method', value });
            }
          }}
        >
          <ToggleGroupItem value="DELIVERY" aria-label="Envío a domicilio">
            Envío a domicilio
          </ToggleGroupItem>
          <ToggleGroupItem
            value="PICKUP"
            disabled={pickupLocations.length === 0}
            aria-label="Retiro en tienda (BOPIS)"
          >
            Retiro en tienda (BOPIS)
          </ToggleGroupItem>
        </ToggleGroup>
        {shippingMethod === 'PICKUP' ? (
          <FormSelect
            value={pickupLocationId}
            onValueChange={(value) => dispatch({ type: 'set_pickup_location', value })}
            placeholder="Selecciona una tienda"
            options={[
              { value: '', label: 'Selecciona una tienda' },
              ...pickupLocations.map((location) => ({
                value: location.id,
                label: `${location.name} — ${location.address}`,
              })),
            ]}
            triggerClassName="normal-case"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
