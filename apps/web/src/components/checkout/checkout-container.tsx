'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/lib/cart-store';
import type { CartItem } from '@/lib/cart-store';
import { useApiClient } from '@/lib/client-api';
import { useAuth } from '@/contexts/auth-context';
import { AddressForm } from './address-form';
import {
  EMPTY_ADDRESS,
  isAddressValid,
  toOrderAddress,
  type AddressFormValues,
} from './address-form.utils';
import { CouponInput } from './coupon-input';
import { EngagementInputs } from './engagement-inputs';
import { OrderSummary } from './order-summary';
import { PaymentForm } from './payment-element';
import { trackEvent } from '@/lib/analytics/track';
import { formatPrice } from '@repo/shared-utils';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import type {
  CreateOrderDto,
  CreatePaymentIntentDto,
  CreatedOrderResult,
  PaymentIntentResult,
  ShippingQuote,
} from '@repo/shared-types';

const FALLBACK_SHIPPING_FLAT_RATE = 5;
const FALLBACK_FREE_SHIPPING_THRESHOLD = 50;

type CheckoutState = {
  address: AddressFormValues;
  couponCode: string;
  referralCode: string;
  loyaltyPoints: number;
  order: CreatedOrderResult | null;
  paymentIntent: PaymentIntentResult | null;
  isSubmitting: boolean;
  error: string | null;
  shippingQuote: ShippingQuote | null;
};

type CheckoutAction =
  | { type: 'set_address'; value: AddressFormValues }
  | { type: 'set_coupon'; value: string }
  | { type: 'set_referral'; value: string }
  | { type: 'set_loyalty'; value: number }
  | { type: 'submit_start' }
  | { type: 'submit_success'; order: CreatedOrderResult; paymentIntent: PaymentIntentResult }
  | { type: 'submit_error'; message: string }
  | { type: 'set_shipping_quote'; quote: ShippingQuote | null };

const checkoutInitialState: CheckoutState = {
  address: EMPTY_ADDRESS,
  couponCode: '',
  referralCode: '',
  loyaltyPoints: 0,
  order: null,
  paymentIntent: null,
  isSubmitting: false,
  error: null,
  shippingQuote: null,
};

function createInitialCheckoutState(): CheckoutState {
  if (typeof window === 'undefined') {
    return checkoutInitialState;
  }

  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) {
    return checkoutInitialState;
  }

  return {
    ...checkoutInitialState,
    referralCode: ref.toUpperCase(),
  };
}

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'set_address':
      return { ...state, address: action.value };
    case 'set_coupon':
      return { ...state, couponCode: action.value };
    case 'set_referral':
      return { ...state, referralCode: action.value };
    case 'set_loyalty':
      return { ...state, loyaltyPoints: action.value };
    case 'submit_start':
      return { ...state, error: null, isSubmitting: true };
    case 'submit_success':
      return {
        ...state,
        order: action.order,
        paymentIntent: action.paymentIntent,
        isSubmitting: false,
      };
    case 'submit_error':
      return { ...state, error: action.message, isSubmitting: false };
    case 'set_shipping_quote':
      return { ...state, shippingQuote: action.quote };
    default:
      return state;
  }
}

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
  } = checkout;
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

  // Client-side estimate for the summary.
  // (subtotal, discount, IVA, shipping) authoritatively on order creation.
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const taxRate = 0.15;
  const tax = taxableBase * taxRate;
  const fallbackShipping =
    subtotal >= FALLBACK_FREE_SHIPPING_THRESHOLD ? 0 : FALLBACK_SHIPPING_FLAT_RATE;
  const shipping = shippingQuote?.amount ?? fallbackShipping;
  const total = taxableBase + tax + shipping;

  React.useEffect(() => {
    if (!isAddressValid(address) || items.length === 0) {
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
  }, [address, api, items.length, taxableBase]);

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
      };

      const createdOrder = await api.orders.create(orderDto);

      const intentDto: CreatePaymentIntentDto = {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        amount: Math.round(Number(createdOrder.total) * 100),
        currency: 'USD',
        provider: 'STRIPE',
        channel: 'WEB',
        customerEmail: address.email,
      };
      const intent = await api.payments.createIntent(intentDto);
      dispatch({ type: 'submit_success', order: createdOrder, paymentIntent: intent });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar el pago. Por favor, inténtalo de nuevo.';
      dispatch({ type: 'submit_error', message });
    }
  }

  // Once the payment intent is created, render the Stripe Payment Element.
  if (order && paymentIntent?.clientSecret) {
    return (
      <AnimatedPageShell
        className="container mx-auto px-4 py-8"
        header={
          <>
            <h1 className="text-3xl font-bold">Completa tu pago</h1>
            <p className="mt-2 text-muted-foreground">
              Pedido {order.orderNumber} · Total {formatPrice(Number(order.total))}
            </p>
          </>
        }
      >
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentForm
                  clientSecret={paymentIntent.clientSecret}
                  orderId={order.id}
                  total={Number(order.total)}
                />
              </CardContent>
            </Card>
            <div className="mt-4">
              <Link
                href={`/orders/${order.id}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Ver detalles del pedido
              </Link>
            </div>
          </div>
          <OrderSummaryCard
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

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={<h1 className="text-3xl font-bold">Finalizar compra</h1>}
    >
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AddressForm values={address} onChange={(value) => dispatch({ type: 'set_address', value })} />

          <Card>
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

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={!isAddressValid(address) || isSubmitting}
            onClick={handleCreateOrder}
          >
            {isSubmitting ? 'Preparando pago…' : 'Continuar al pago'}
          </Button>
        </div>

        <OrderSummaryCard
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

interface OrderSummaryCardProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponCode?: string;
}

function OrderSummaryCard(props: OrderSummaryCardProps) {
  return (
    <div>
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Resumen del pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderSummary {...props} />
        </CardContent>
      </Card>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
