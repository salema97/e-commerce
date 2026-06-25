'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/form-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { useApiClient } from '@/lib/client-api';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order, OrderStatus, Shipment } from '@repo/shared-types';
import { RefundPanel } from './refund-panel';
import { ShipmentPanel } from './shipment-panel';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  'PROCESSING',
  'PARTIALLY_SHIPPED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
];

export default function AdminOrderDetailPage({
  order,
  initialShipments,
}: {
  order: Order;
  initialShipments: Shipment[];
}) {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleStatusUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await api.orders.updateStatus(order.id, {
        status: String(formData.get('status')) as OrderStatus,
        notes: String(formData.get('notes')),
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pedido {order.orderNumber}</h1>
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
            </CardContent>
          </Card>
          </NeoReveal>

          <RefundPanel order={order} />

          <ShipmentPanel orderId={order.id} initialShipments={initialShipments} />

          <NeoReveal delay={0.08}>
            <Card>
            <CardHeader>
              <CardTitle>Actualizar estado</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStatusUpdate} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <FormSelect
                    id="status"
                    name="status"
                    defaultValue={order.status}
                    options={ORDER_STATUSES.map((status) => ({
                      value: status,
                      label: orderStatusLabel(status),
                    }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Actualizando…' : 'Actualizar estado'}
                </Button>
              </form>
            </CardContent>
          </Card>
          </NeoReveal>
        </div>
      </div>
    </AnimatedPageShell>
  );
}
