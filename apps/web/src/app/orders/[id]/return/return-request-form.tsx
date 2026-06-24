'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

interface ReturnRequestFormProps {
  order: Order;
  isGuest?: boolean;
}

export default function ReturnRequestForm({ order, isGuest = false }: ReturnRequestFormProps) {
  const router = useRouter();
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const [selected, setSelected] = React.useState<Record<string, { qty: number; reason: string }>>({});
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const windowDays = 30;
  const isWithinWindow =
    new Date(order.createdAt).getTime() + windowDays * 24 * 60 * 60 * 1000 >= Date.now();

  function toggleItem(itemId: string, maxQty: number) {
    setSelected((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { qty: maxQty, reason: '' } };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    const items = Object.entries(selected).map(([itemId, value]) => {
      const orderItem = order.items.find((i) => i.id === itemId)!;
      return {
        productId: orderItem.productId,
        productVariantId: orderItem.variantId ?? undefined,
        quantity: value.qty,
      };
    });

    try {
      if (isGuest) {
        await api.returns.createGuest({
          orderId: order.id,
          email,
          items,
          reason:
            Object.values(selected)
              .map((item) => item.reason)
              .filter(Boolean)
              .join('; ') || 'Customer return',
        });
      } else {
        await api.returns.createForOrder(order.id, {
          items,
          reason:
            Object.values(selected)
              .map((item) => item.reason)
              .filter(Boolean)
              .join('; ') || 'Customer return',
        });
        router.push(`/orders/${order.id}`);
        router.refresh();
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted && isGuest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Return request submitted</h1>
        <p className="text-muted-foreground">
          We received your return request for order {order.orderNumber}. Status: Requested.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Request return for order {order.orderNumber}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {isGuest ? (
          <Card>
            <CardHeader>
              <CardTitle>Order email</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email address associated with this order</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="customer@example.com"
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Select items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-md border p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[item.id])}
                    onChange={() => toggleItem(item.id, item.quantity)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku} · {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </label>

                {selected[item.id] ? (
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-1">
                      <label className="text-sm font-medium">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={selected[item.id].qty}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              qty: Math.min(
                                Math.max(1, Number(e.target.value)),
                                item.quantity,
                              ),
                            },
                          }))
                        }
                        className="w-24 rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-sm font-medium">Reason</label>
                      <input
                        type="text"
                        value={selected[item.id].reason}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], reason: e.target.value },
                          }))
                        }
                        className="rounded-md border px-3 py-2 text-sm"
                        placeholder="Reason for returning this item"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={
            isSubmitting
            || Object.keys(selected).length === 0
            || !isWithinWindow
            || (isGuest && !email)
            || (!isGuest && !authReady)
          }
        >
          {isSubmitting ? 'Submitting...' : 'Submit return request'}
        </Button>

        {!isWithinWindow ? (
          <p className="text-sm text-destructive">
            The return window for this order has closed.
          </p>
        ) : null}
      </form>
    </div>
  );
}
