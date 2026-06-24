import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';
import { PaymentStatus } from './payment-status';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function isReturnable(order: Order): boolean {
  if (order.status !== 'DELIVERED') return false;
  const deliveredAt = new Date(order.createdAt);
  const windowDays = 30;
  return deliveredAt.getTime() + windowDays * 24 * 60 * 60 * 1000 >= Date.now();
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [session, { id }, api] = await Promise.all([
    getSession(),
    params,
    getServerApiClient(),
  ]);

  if (!session) {
    redirect('/sign-in?redirect_url=/orders');
  }

  const order = await api.orders.findOne(id).catch(() => null);

  if (!order) {
    notFound();
  }

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pedido {order.orderNumber}</h1>
          <Badge variant="outline">{orderStatusLabel(order.status)}</Badge>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <NeoReveal>
            <Card>
            <CardHeader>
              <CardTitle>Artículos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku} · Cantidad: {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          </NeoReveal>

          {order.statusHistory && order.statusHistory.length > 0 ? (
            <NeoReveal delay={0.08}>
              <Card>
              <CardHeader>
                <CardTitle>Historial de estado</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {order.statusHistory.map((entry) => (
                  <div key={entry.id} className="flex justify-between text-sm">
                    <span>{orderStatusLabel(entry.status)}</span>
                    <span className="text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            </NeoReveal>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <NeoReveal delay={0.04}>
            <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 ? (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento{order.couponCode ? ` (${order.couponCode})` : null}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm">
                <span>IVA</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío</span>
                <span>{formatPrice(order.shippingAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <Separator />
              <PaymentStatus orderId={order.id} payments={order.payments} />
              {isReturnable(order) ? (
                <Link href={`/orders/${order.id}/return`}>
                  <Button variant="outline" className="w-full">
                    Solicitar devolución
                  </Button>
                </Link>
              ) : null}
            </CardContent>
          </Card>
          </NeoReveal>

          <NeoReveal delay={0.12}>
            <Card>
              <CardHeader>
                <CardTitle>Dirección de envío</CardTitle>
              </CardHeader>
              <CardContent>
                {order.shippingAddress ? (
                  <address className="not-italic text-sm text-muted-foreground">
                    {order.shippingAddress.recipientName}
                    <br />
                    {order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city}
                    {order.shippingAddress.zipCode ? `, ${order.shippingAddress.zipCode}` : null}
                  </address>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin dirección de envío.</p>
                )}
              </CardContent>
            </Card>
          </NeoReveal>
        </div>
      </div>
    </AnimatedPageShell>
  );
}
