'use client';

import type { Dispatch } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CartItem } from '@/lib/cart-store';
import type { ShippingMethodType } from '@repo/shared-types';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AddressForm } from './address-form';
import { isAddressValid, type AddressFormValues } from './address-form.utils';
import { CouponInput } from './coupon-input';
import { EngagementInputs } from './engagement-inputs';
import { CheckoutDeliverySection } from './checkout-delivery-section';
import { CheckoutOrderSummaryCard } from './checkout-order-summary-card';
import type { CheckoutAction } from './checkout-state';
import type { StoreLocation } from '@repo/shared-types';

interface CheckoutFormStepProps {
  address: AddressFormValues;
  couponCode: string;
  referralCode: string;
  loyaltyPoints: number;
  shippingMethod: ShippingMethodType;
  pickupLocationId: string;
  pickupLocations: StoreLocation[];
  isSubmitting: boolean;
  error: string | null;
  user: { id: string } | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  dispatch: Dispatch<CheckoutAction>;
  onCreateOrder: () => void;
}

export function CheckoutFormStep({
  address,
  couponCode,
  referralCode,
  loyaltyPoints,
  shippingMethod,
  pickupLocationId,
  pickupLocations,
  isSubmitting,
  error,
  user,
  items,
  subtotal,
  discount,
  tax,
  shipping,
  total,
  dispatch,
  onCreateOrder,
}: CheckoutFormStepProps) {
  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={<h1 className="text-3xl font-bold">Finalizar compra</h1>}
    >
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AddressForm
            values={address}
            onChange={(value) => dispatch({ type: 'set_address', value })}
          />

          <CheckoutDeliverySection
            shippingMethod={shippingMethod}
            pickupLocationId={pickupLocationId}
            pickupLocations={pickupLocations}
            dispatch={dispatch}
          />

          <Card className="brutalist-card">
            <CardHeader>
              <CardTitle>Cupón</CardTitle>
            </CardHeader>
            <CardContent>
              <CouponInput
                couponCode={couponCode}
                onCouponCodeChange={(value) => dispatch({ type: 'set_coupon', value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referidos y puntos</CardTitle>
            </CardHeader>
            <CardContent>
              <EngagementInputs
                subtotal={subtotal}
                referralCode={referralCode}
                onReferralCodeChange={(value) => dispatch({ type: 'set_referral', value })}
                loyaltyPoints={loyaltyPoints}
                onLoyaltyPointsChange={(value) => dispatch({ type: 'set_loyalty', value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {user
                  ? 'Haz clic en continuar para crear tu pedido y cargar el formulario seguro de pago con Stripe.'
                  : 'Estás comprando como invitado. Puedes crear una cuenta después de la compra.'}
              </p>
            </CardContent>
          </Card>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="button"
            className="w-full"
            disabled={
              !isAddressValid(address) ||
              isSubmitting ||
              (shippingMethod === 'PICKUP' && !pickupLocationId)
            }
            onClick={onCreateOrder}
          >
            {isSubmitting ? 'Preparando pago…' : 'Continuar al pago'}
          </Button>
        </div>

        <CheckoutOrderSummaryCard
          items={items}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          shipping={shipping}
          total={total}
          couponCode={couponCode}
        />
      </div>
    </AnimatedPageShell>
  );
}
