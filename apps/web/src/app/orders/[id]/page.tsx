import { redirect, notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/orders');
  }

  const { id } = await params;
  const api = getServerApiClient();

  let order: Order;
  try {
    order = await api.orders.findOne(id);
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
        <Badge variant="outline">{orderStatusLabel(order.status)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
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
                      SKU: {item.sku} · Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.statusHistory && order.statusHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
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
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
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
                <p className="text-sm text-muted-foreground">No shipping address.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
