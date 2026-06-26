'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { useApiClient } from '@/lib/client-api';
import { useAuth } from '@/contexts/auth-context';
import { toOrderAddress } from './address-form.utils';
import { isAddressValid } from './address-form.utils';
import { trackEvent } from '@/lib/analytics/track';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import type { CreateOrderDto, CreatePaymentIntentDto, StoreLocation } from '@repo/shared-types';
import {
  checkoutReducer,
  createInitialCheckoutState,
} from './checkout-state';
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FLAT_RATE,
  ECUADOR_IVA_RATE,
} from '@repo/shared-utils';
import { CheckoutFormStep } from './checkout-form-step';
import { CheckoutPaymentStep } from './checkout-payment-step';

export function CheckoutContainer() {
  const router = useRouter();
  const { user } = useAuth();
  const api = useApiClient();
  const { items } = useCartStore();
  const [checkout, dispatch] = React.useReducer(checkoutReducer, undefined, createInitialCheckoutState);
  const {
    address,
    couponCode,
    referralCode,
    loyaltyPoints,
    order,
    paymentIntent,
    isSubmitting,
    error,
    shippingQuote,
    shippingMethod,
    pickupLocationId,
  } = checkout;
  const [pickupLocations, setPickupLocations] = React.useState<StoreLocation[]>([]);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const beginCheckoutTrackedRef = React.useRef(false);

  React.useEffect(() => {
    if (beginCheckoutTrackedRef.current || items.length === 0) {
      return;
    }
    beginCheckoutTrackedRef.current = true;
    void trackEvent('begin_checkout', {
      cartTotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const taxRate = ECUADOR_IVA_RATE;
  const tax = taxableBase * taxRate;
  const fallbackShipping =
    subtotal >= DEFAULT_FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FLAT_RATE;

  React.useEffect(() => {
    void api.pos.listLocations(true).then(setPickupLocations).catch(() => setPickupLocations([]));
  }, [api]);

  const shipping = shippingMethod === 'PICKUP' ? 0 : (shippingQuote?.amount ?? fallbackShipping);
  const total = taxableBase + tax + shipping;

  React.useEffect(() => {
    if (shippingMethod !== 'DELIVERY' || !isAddressValid(address) || items.length === 0) {
      dispatch({ type: 'set_shipping_quote', quote: null });
      return;
    }

    let cancelled = false;
    void api.shipping
      .quote({
        country: address.country,
        province: address.state,
        subtotal: taxableBase,
        freeShipping: false,
      })
      .then((quote) => {
        if (!cancelled) {
          dispatch({ type: 'set_shipping_quote', quote });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: 'set_shipping_quote', quote: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, api, items.length, shippingMethod, taxableBase]);

  async function handleCreateOrder() {
    dispatch({ type: 'submit_start' });
    try {
      const orderDto: CreateOrderDto = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        channel: 'WEB',
        couponCode: couponCode.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
        loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
        customerEmail: address.email,
        customerPhone: address.phone || undefined,
        shippingAddress: toOrderAddress(address),
        billingAddress: toOrderAddress(address),
        notes: address.notes || undefined,
        shippingMethod,
        pickupLocationId: shippingMethod === 'PICKUP' ? pickupLocationId : undefined,
      };

      const createdOrder = await api.orders.create(orderDto);
      const intent = await api.payments.createIntent({
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        amount: Math.round(Number(createdOrder.total) * 100),
        currency: 'USD',
        provider: 'STRIPE',
        channel: 'WEB',
        customerEmail: address.email,
      } satisfies CreatePaymentIntentDto);

      dispatch({ type: 'submit_success', order: createdOrder, paymentIntent: intent });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo iniciar el pago. Por favor, inténtalo de nuevo.';
      dispatch({ type: 'submit_error', message });
    }
  }

  if (!mounted) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0 && !order) {
    return (
      <AnimatedPageShell className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <Button className="mt-6" onClick={() => router.push('/store')}>
          Seguir comprando
        </Button>
      </AnimatedPageShell>
    );
  }

  if (order && paymentIntent?.clientSecret) {
    return (
      <CheckoutPaymentStep
        order={order}
        clientSecret={paymentIntent.clientSecret}
        items={items}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
        shipping={shipping}
        total={total}
        couponCode={couponCode}
      />
    );
  }

  return (
    <CheckoutFormStep
      address={address}
      couponCode={couponCode}
      referralCode={referralCode}
      loyaltyPoints={loyaltyPoints}
      shippingMethod={shippingMethod}
      pickupLocationId={pickupLocationId}
      pickupLocations={pickupLocations}
      isSubmitting={isSubmitting}
      error={error}
      user={user}
      items={items}
      subtotal={subtotal}
      discount={discount}
      tax={tax}
      shipping={shipping}
      total={total}
      dispatch={dispatch}
      onCreateOrder={() => void handleCreateOrder()}
    />
  );
}

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="h-96 animate-pulse rounded bg-muted lg:col-span-2" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
