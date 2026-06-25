'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@repo/shared-utils';
import type { CreatedOrderResult } from '@repo/shared-types';
import type { CartItem } from '@/lib/cart-store';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { PaymentForm } from './payment-element';
import { CheckoutOrderSummaryCard } from './checkout-order-summary-card';

interface CheckoutPaymentStepProps {
  order: CreatedOrderResult;
  clientSecret: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponCode: string;
}

export function CheckoutPaymentStep({
  order,
  clientSecret,
  items,
  subtotal,
  discount,
  tax,
  shipping,
  total,
  couponCode,
}: CheckoutPaymentStepProps) {
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
                clientSecret={clientSecret}
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
