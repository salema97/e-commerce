'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiClient } from '@/lib/client-api';
import {
  formatPrice,
  returnStatusLabel,
  refundMethodLabel,
} from '@repo/shared-utils';
import type { ReturnRequest, RefundMethod } from '@repo/shared-types';

const METHODS: RefundMethod[] = ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'EXCHANGE'];

export default function ResolveReturnPage({ returnRequest }: { returnRequest: ReturnRequest }) {
  const router = useRouter();
  const api = useApiClient();
  const [method, setMethod] = React.useState<RefundMethod>('ORIGINAL_PAYMENT');
  const [notes, setNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const total = returnRequest.items.reduce(
    (sum, item) => sum + (item.refundValue ?? 0) * item.quantity,
    0,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await api.returns.resolve(returnRequest.id, { refundMethod: method, notes });
      router.push(`/admin/returns/${returnRequest.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Resolve Return</h1>
        <Badge variant="outline">{returnStatusLabel(returnRequest.status)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Items to resolve</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {returnRequest.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.productId}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold">
                  {formatPrice((item.refundValue ?? 0) * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-4 font-semibold">
              <span>Total refund value</span>
              <span>{formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution method</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {METHODS.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    <span className="font-medium">{refundMethodLabel(m)}</span>
                  </label>
                ))}
              </div>

              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isSubmitting || returnRequest.status !== 'INSPECTION'}>
                {isSubmitting ? 'Resolving...' : 'Confirm resolution'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
