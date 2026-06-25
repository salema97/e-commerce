'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { AlertDescription } from '@/components/ui/alert-description';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

interface ReturnRequestFormProps {
  order: Order;
  isGuest?: boolean;
}

function combineReturnReasons(
  selected: Record<string, { qty: number; reason: string }>,
): string {
  const reasons = Object.values(selected).flatMap((item) => (item.reason ? [item.reason] : []));
  return reasons.join('; ') || 'Devolución del cliente';
}

type ReturnFormState = {
  selected: Record<string, { qty: number; reason: string }>;
  email: string;
  isSubmitting: boolean;
  error: string;
  submitted: boolean;
};

type ReturnFormAction =
  | { type: 'select_item'; itemId: string; maxQty: number }
  | { type: 'deselect_item'; itemId: string }
  | { type: 'set_item_qty'; itemId: string; qty: number }
  | { type: 'set_item_reason'; itemId: string; reason: string }
  | { type: 'set_email'; value: string }
  | { type: 'submit_start' }
  | { type: 'submit_success' }
  | { type: 'submit_error'; message: string };

const returnFormInitialState: ReturnFormState = {
  selected: {},
  email: '',
  isSubmitting: false,
  error: '',
  submitted: false,
};

function returnFormReducer(state: ReturnFormState, action: ReturnFormAction): ReturnFormState {
  switch (action.type) {
    case 'select_item':
      return {
        ...state,
        selected: {
          ...state.selected,
          [action.itemId]: { qty: action.maxQty, reason: state.selected[action.itemId]?.reason ?? '' },
        },
      };
    case 'deselect_item': {
      const { [action.itemId]: _, ...rest } = state.selected;
      return { ...state, selected: rest };
    }
    case 'set_item_qty':
      return {
        ...state,
        selected: {
          ...state.selected,
          [action.itemId]: { ...state.selected[action.itemId], qty: action.qty },
        },
      };
    case 'set_item_reason':
      return {
        ...state,
        selected: {
          ...state.selected,
          [action.itemId]: { ...state.selected[action.itemId], reason: action.reason },
        },
      };
    case 'set_email':
      return { ...state, email: action.value };
    case 'submit_start':
      return { ...state, isSubmitting: true, error: '' };
    case 'submit_success':
      return { ...state, isSubmitting: false, submitted: true };
    case 'submit_error':
      return { ...state, isSubmitting: false, error: action.message };
    default:
      return state;
  }
}

export default function ReturnRequestForm({ order, isGuest = false }: ReturnRequestFormProps) {
  const router = useRouter();
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const [mounted, setMounted] = React.useState(false);
  const [form, dispatch] = React.useReducer(returnFormReducer, returnFormInitialState);
  const { selected, email, isSubmitting, error, submitted } = form;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const windowDays = 30;
  const isWithinWindow =
    new Date(order.createdAt).getTime() + windowDays * 24 * 60 * 60 * 1000 >= Date.now();

  function setItemSelected(itemId: string, maxQty: number, checked: boolean) {
    if (checked) {
      dispatch({ type: 'select_item', itemId, maxQty });
    } else {
      dispatch({ type: 'deselect_item', itemId });
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    dispatch({ type: 'submit_start' });
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
          reason: combineReturnReasons(selected),
        });
      } else {
        await api.returns.createForOrder(order.id, {
          items,
          reason: combineReturnReasons(selected),
        });
        router.push(`/orders/${order.id}`);
        router.refresh();
      }
      dispatch({ type: 'submit_success' });
    } catch (err) {
      dispatch({
        type: 'submit_error',
        message: err instanceof Error ? err.message : 'No se pudo enviar la solicitud de devolución',
      });
    }
  }

  if (submitted && isGuest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Solicitud de devolución enviada</h1>
        <p className="text-muted-foreground">
          Recibimos tu solicitud de devolución para el pedido {order.orderNumber}. Estado: Solicitada.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Solicitar devolución del pedido {order.orderNumber}</h1>
      <form data-testid="return-request-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                onChange={(e) => dispatch({ type: 'set_email', value: e.target.value })}
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
            {order.items.map((item) => (
              <div
                key={item.id}
                className="border-[3px] border-neo-onyx bg-white p-4 shadow-[4px_4px_0_0_#111111]"
              >
                <div className="flex items-center gap-3">
                  {mounted ? (
                  <input
                    type="checkbox"
                    id={`item-${item.id}`}
                    data-testid={`return-item-${item.id}`}
                    checked={Boolean(selected[item.id])}
                    onChange={(event) => {
                      setItemSelected(item.id, item.quantity, event.target.checked);
                    }}
                    className="size-5 shrink-0 border-[3px] border-neo-onyx accent-neo-gold"
                  />
                  ) : (
                    <div
                      aria-hidden
                      className="size-5 shrink-0 border-[3px] border-neo-onyx bg-white"
                    />
                  )}
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
                          dispatch({
                            type: 'set_item_qty',
                            itemId: item.id,
                            qty: Math.min(
                              Math.max(1, Number(e.target.value)),
                              item.quantity,
                            ),
                          })
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
                          dispatch({
                            type: 'set_item_reason',
                            itemId: item.id,
                            reason: e.target.value,
                          })
                        }
                        placeholder="Motivo de la devolución de este artículo"
                        className="normal-case"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
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
            !mounted
            || isSubmitting
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
    </div>
  );
}
