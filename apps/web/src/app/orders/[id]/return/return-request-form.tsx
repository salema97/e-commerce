'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedPageShell, NeoItem, NeoStagger } from '@/components/motion/neo-page-transition';
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
              .join('; ') || 'Devolución del cliente',
        });
      } else {
        await api.returns.createForOrder(order.id, {
          items,
          reason:
            Object.values(selected)
              .map((item) => item.reason)
              .filter(Boolean)
              .join('; ') || 'Devolución del cliente',
        });
        router.push(`/orders/${order.id}`);
        router.refresh();
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud de devolución');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted && isGuest) {
    return (
      <AnimatedPageShell className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Solicitud de devolución enviada</h1>
        <p className="text-muted-foreground">
          Recibimos tu solicitud de devolución para el pedido {order.orderNumber}. Estado: Solicitada.
        </p>
      </AnimatedPageShell>
    );
  }

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={
        <h1 className="mb-6 text-2xl font-bold">Solicitar devolución del pedido {order.orderNumber}</h1>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {isGuest ? (
          <Card>
            <CardHeader>
              <CardTitle>Correo del pedido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico asociado a este pedido</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="cliente@ejemplo.com"
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar artículos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NeoStagger className="flex flex-col gap-4">
            {order.items.map((item) => (
              <NeoItem key={item.id}>
              <div className="border-[3px] border-neo-onyx bg-white p-4 shadow-[4px_4px_0_0_#111111]">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={Boolean(selected[item.id])}
                    onCheckedChange={() => toggleItem(item.id, item.quantity)}
                  />
                  <Label htmlFor={`item-${item.id}`} className="flex flex-1 cursor-pointer flex-col gap-1 normal-case">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      SKU: {item.sku} · {formatPrice(item.price * item.quantity)}
                    </span>
                  </Label>
                </div>

                {selected[item.id] ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`qty-${item.id}`}>Cantidad</Label>
                      <Input
                        id={`qty-${item.id}`}
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
                        className="w-24"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`reason-${item.id}`}>Motivo</Label>
                      <Input
                        id={`reason-${item.id}`}
                        type="text"
                        value={selected[item.id].reason}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], reason: e.target.value },
                          }))
                        }
                        placeholder="Motivo de la devolución de este artículo"
                        className="normal-case"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              </NeoItem>
            ))}
            </NeoStagger>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
          {isSubmitting ? 'Enviando…' : 'Enviar solicitud de devolución'}
        </Button>

        {!isWithinWindow ? (
          <Alert variant="destructive">
            <AlertDescription>
              El plazo de devolución para este pedido ha finalizado.
            </AlertDescription>
          </Alert>
        ) : null}
      </form>
    </AnimatedPageShell>
  );
}
