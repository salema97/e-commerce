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
import {
  AddressForm,
  EMPTY_ADDRESS,
  isAddressValid,
  toOrderAddress,
  type AddressFormValues,
} from './address-form';
import { CouponInput } from './coupon-input';
import { OrderSummary } from './order-summary';
import { PaymentForm } from './payment-element';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import type {
  CreateOrderDto,
  CreatePaymentIntentDto,
  CreatedOrderResult,
  PaymentIntentResult,
} from '@repo/shared-types';

const SHIPPING_FLAT_RATE = 5;
const FREE_SHIPPING_THRESHOLD = 50;

export function CheckoutContainer() {
  const router = useRouter();
  const { user } = useAuth();
  const api = useApiClient();
  const { items } = useCartStore();

  const [address, setAddress] = React.useState<AddressFormValues>(EMPTY_ADDRESS);
  const [couponCode, setCouponCode] = React.useState('');

  const [order, setOrder] = React.useState<CreatedOrderResult | null>(null);
  const [paymentIntent, setPaymentIntent] = React.useState<PaymentIntentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Client-side estimate for the summary.
  // (subtotal, discount, IVA, shipping) authoritatively on order creation.
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const taxRate = 0.15;
  // Discount is unknown until the server validates the coupon at order
  // creation; the estimate assumes no discount for the live preview.
  const discount = 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const tax = taxableBase * taxRate;
  const total = taxableBase + tax + shipping;

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
      const message = err instanceof Error ? err.message : 'No se pudo iniciar el pago. Por favor, inténtalo de nuevo.';
      setError(message);
    } finally {
      setIsSubmitting(false);
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
              Pedido {order.orderNumber} · Total {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(order.total))}
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
          <AddressForm values={address} onChange={setAddress} />

          <Card>
            <CardHeader>
              <CardTitle>Cupón</CardTitle>
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
