'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/form-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApiClient, useApiQueryHooks } from '@/lib/client-api';
import { formatPrice, refundStatusLabel } from '@repo/shared-utils';
import type { Order, Refund, RefundStatus } from '@repo/shared-types';

interface RefundPanelProps {
  order: Order;
}

function refundStatusVariant(status: RefundStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

type RefundFormState = {
  type: 'full' | 'partial';
  amount: string;
  reason: string;
  isSubmitting: boolean;
  error: string | null;
};

type RefundFormAction =
  | { type: 'set_type'; value: 'full' | 'partial' }
  | { type: 'set_amount'; value: string }
  | { type: 'set_reason'; value: string }
  | { type: 'submit_start' }
  | { type: 'submit_success' }
  | { type: 'submit_error'; message: string };

const refundFormInitialState: RefundFormState = {
  type: 'full',
  amount: '',
  reason: '',
  isSubmitting: false,
  error: null,
};

function refundFormReducer(state: RefundFormState, action: RefundFormAction): RefundFormState {
  switch (action.type) {
    case 'set_type':
      return { ...state, type: action.value };
    case 'set_amount':
      return { ...state, amount: action.value };
    case 'set_reason':
      return { ...state, reason: action.value };
    case 'submit_start':
      return { ...state, error: null, isSubmitting: true };
    case 'submit_success':
      return { ...refundFormInitialState };
    case 'submit_error':
      return { ...state, isSubmitting: false, error: action.message };
    default:
      return state;
  }
}

export function RefundPanel({ order }: RefundPanelProps) {
  const router = useRouter();
  const api = useApiClient();
  const hooks = useApiQueryHooks();
  const approveRefund = hooks.useApproveRefund({
    onSuccess: () => router.refresh(),
  });
  const [form, dispatch] = React.useReducer(refundFormReducer, refundFormInitialState);
  const { type, amount, reason, isSubmitting, error } = form;

  const refunds = (order.refunds ?? []) as Refund[];
  const canRefund =
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED';

  const refundAmount = type === 'full' ? Number(order.total) : Number(amount) || 0;

  async function handleRefund(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: 'submit_start' });
    try {
      await api.orders.createRefund(order.id, {
        amount: refundAmount,
        type,
        reason: reason || undefined,
      });
      dispatch({ type: 'submit_success' });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'El reembolso falló.';
      dispatch({ type: 'submit_error', message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reembolsos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {refunds.length > 0 ? (
          <div className="flex flex-col gap-3">
            {refunds.map((refund) => (
              <div key={refund.id} className="flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {refund.type === 'partial' ? 'Reembolso parcial' : 'Reembolso total'} · {formatPrice(refund.amount)}
                  </span>
                  <Badge variant={refundStatusVariant(refund.status)}>
                    {refundStatusLabel(refund.status)}
                  </Badge>
                </div>
                {refund.reason ? (
                  <span className="text-muted-foreground">{refund.reason}</span>
                ) : null}
                {refund.status === 'PENDING' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={approveRefund.isPending}
                    onClick={() => approveRefund.mutate(refund.id)}
                  >
                    {approveRefund.isPending ? 'Aprobando…' : 'Aprobar reembolso'}
                  </Button>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {new Date(refund.createdAt).toLocaleString('es-EC')}
                </span>
              </div>
            ))}
            <Separator />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no se han emitido reembolsos.</p>
        )}

        {canRefund ? (
          <form onSubmit={handleRefund} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="refundType">Tipo de reembolso</Label>
              <FormSelect
                id="refundType"
                value={type}
                onValueChange={(value) => dispatch({ type: 'set_type', value: value as 'full' | 'partial' })}
                options={[
                  { value: 'full', label: `Total (${formatPrice(Number(order.total))})` },
                  { value: 'partial', label: 'Parcial' },
                ]}
              />
            </div>

            {type === 'partial' ? (
              <div className="grid gap-2">
                <Label htmlFor="refundAmount">Monto (USD)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  min={0.01}
                  max={Number(order.total)}
                  step="0.01"
                  value={amount}
                  onChange={(e) => dispatch({ type: 'set_amount', value: e.target.value })}
                  required
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="refundReason">Motivo</Label>
              <Textarea
                id="refundReason"
                value={reason}
                onChange={(e) => dispatch({ type: 'set_reason', value: e.target.value })}
                placeholder="Motivo del reembolso (opcional)"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || (type === 'partial' && !amount)}
            >
              {isSubmitting
                ? 'Procesando reembolso…'
                : `Emitir reembolso ${type === 'partial' ? 'parcial' : `total de ${formatPrice(Number(order.total))}`}`}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Los reembolsos solo están disponibles para pedidos pagados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
