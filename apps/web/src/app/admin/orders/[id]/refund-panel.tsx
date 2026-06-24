'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApiClient } from '@/lib/client-api';
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

export function RefundPanel({ order }: RefundPanelProps) {
  const router = useRouter();
  const api = useApiClient();
  const [type, setType] = React.useState<'full' | 'partial'>('full');
  const [amount, setAmount] = React.useState<string>('');
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refunds = (order.refunds ?? []) as Refund[];
  const canRefund =
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED';

  const refundAmount = type === 'full' ? Number(order.total) : Number(amount) || 0;

  async function handleRefund(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.orders.createRefund(order.id, {
        amount: refundAmount,
        type,
        reason: reason || undefined,
      });
      setReason('');
      setAmount('');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'El reembolso falló.';
      setError(message);
    } finally {
      setIsSubmitting(false);
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
              <Select
                id="refundType"
                value={type}
                onChange={(e) => setType(e.target.value as 'full' | 'partial')}
              >
                <option value="full">Total ({formatPrice(Number(order.total))})</option>
                <option value="partial">Parcial</option>
              </Select>
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
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="refundReason">Motivo</Label>
              <Textarea
                id="refundReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
