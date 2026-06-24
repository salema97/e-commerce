'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/lib/cart-store';
import type { CartItem } from '@/lib/cart-store';
import { useApiClient } from '@/lib/client-api';
import { useAuth } from '@clerk/nextjs';
import {
  AddressForm,
  EMPTY_ADDRESS,
  isAddressValid,
  toOrderAddress,
  type AddressFormValues,
} from './address-form';
import { CouponInput } from './coupon-input';
import { EngagementInputs } from './engagement-inputs';
import { OrderSummary } from './order-summary';
import { PaymentForm } from './payment-element';
import { trackEvent } from '@/lib/analytics/track';
import type {
  CreateOrderDto,
  CreatePaymentIntentDto,
  CreatedOrderResult,
  PaymentIntentResult,
  ShippingQuote,
} from '@repo/shared-types';

const FALLBACK_SHIPPING_FLAT_RATE = 5;
const FALLBACK_FREE_SHIPPING_THRESHOLD = 50;

export function CheckoutContainer() {
  const router = useRouter();
  const { userId } = useAuth();
  const api = useApiClient();
  const { items } = useCartStore();
  const [mounted, setMounted] = React.useState(false);

  const [address, setAddress] = React.useState<AddressFormValues>(EMPTY_ADDRESS);
  const [couponCode, setCouponCode] = React.useState('');
  const [referralCode, setReferralCode] = React.useState('');
  const [loyaltyPoints, setLoyaltyPoints] = React.useState(0);
  const [shippingQuote, setShippingQuote] = React.useState<ShippingQuote | null>(null);

  const [order, setOrder] = React.useState<CreatedOrderResult | null>(null);
  const [paymentIntent, setPaymentIntent] = React.useState<PaymentIntentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    if (items.length > 0) {
      void trackEvent('begin_checkout', { itemCount: items.length });
    }
  }, [items.length]);

  // Client-side estimate for the summary. The server recomputes totals
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
      setShippingQuote(null);
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
        if (!cancelled) setShippingQuote(quote);
      })
      .catch(() => {
        if (!cancelled) setShippingQuote(null);
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
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Button className="mt-6" onClick={() => router.push('/store')}>
          Continue shopping
        </Button>
      </div>
    );
  }

  async function handleCreateOrder() {
    setError(null);
    setIsSubmitting(true);
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
      setOrder(createdOrder);

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
      setPaymentIntent(intent);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start checkout. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Once the payment intent is created, render the Stripe Payment Element.
  if (order && paymentIntent?.clientSecret) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Complete your payment</h1>
        <p className="mt-2 text-muted-foreground">
          Order {order.orderNumber} · Total {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(order.total))}
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
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
                View order details
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AddressForm values={address} onChange={setAddress} />

          <Card>
            <CardHeader>
              <CardTitle>Coupon</CardTitle>
            </CardHeader>
            <CardContent>
              <CouponInput
                couponCode={couponCode}
                onCouponCodeChange={setCouponCode}
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
                onReferralCodeChange={setReferralCode}
                loyaltyPoints={loyaltyPoints}
                onLoyaltyPointsChange={setLoyaltyPoints}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {userId
                  ? 'Click continue to create your order and load the secure Stripe payment form.'
                  : 'You are checking out as a guest. You can create an account after purchase.'}
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
            {isSubmitting ? 'Preparing payment...' : `Continue to payment`}
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
    </div>
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
          <CardTitle>Order Summary</CardTitle>
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
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-64 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-72 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
