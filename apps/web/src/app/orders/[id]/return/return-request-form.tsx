'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default function ReturnRequestForm({ order }: { order: Order }) {
  const router = useRouter();
  const api = useApiClient();
  const [selected, setSelected] = React.useState<Record<string, { qty: number; reason: string }>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    const items = Object.entries(selected).map(([itemId, value]) => {
      const orderItem = order.items.find((i) => i.id === itemId)!;
      return {
        productId: orderItem.productId,
        variantId: orderItem.variantId ?? undefined,
        quantity: value.qty,
        reason: value.reason,
      };
    });

    try {
      await api.returns.createForOrder(order.id, {
        items,
        reason: items.map((i) => i.reason).join('; ') || 'Customer return',
      });
      router.push(`/orders/${order.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Request return for order {order.orderNumber}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

        <Button
          type="submit"
          disabled={isSubmitting || Object.keys(selected).length === 0 || !isWithinWindow}
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
