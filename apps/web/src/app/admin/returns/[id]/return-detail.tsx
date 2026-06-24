'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApiClient } from '@/lib/client-api';
import {
  formatPrice,
  formatDate,
  returnStatusLabel,
  refundMethodLabel,
} from '@repo/shared-utils';
import type { ReturnRequest, ReturnStatus } from '@repo/shared-types';

const ADMIN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['INSPECTION', 'REJECTED'],
  INSPECTION: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  RESOLUTION_PENDING_CREDIT_NOTE: ['RESOLVED', 'REJECTED'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};

export default function ReturnDetail({ returnRequest }: { returnRequest: ReturnRequest }) {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const availableTransitions = ADMIN_TRANSITIONS[returnRequest.status];

  async function handleStatusUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    const formData = new FormData(event.currentTarget);
    try {
      await api.returns.updateStatus(returnRequest.id, {
        status: String(formData.get('status')) as ReturnStatus,
        notes: String(formData.get('notes')),
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Devolución {returnRequest.id.slice(0, 8)}</h1>
          <Badge variant="outline">{returnStatusLabel(returnRequest.status)}</Badge>
        </div>
        <Link href={`/admin/returns/${returnRequest.id}/resolve`}>
          <Button disabled={returnRequest.status !== 'INSPECTION'}>Resolver</Button>
        </Link>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Artículos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {returnRequest.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.productId}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.quantity} · Condición: {item.condition ?? 'Sin inspeccionar'}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice((item.refundValue ?? 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span>Motivo</span>
                <span>{returnRequest.reason}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Resolución</span>
                <span>
                  {returnRequest.refundMethod
                    ? refundMethodLabel(returnRequest.refundMethod)
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Creada</span>
                <span>{formatDate(returnRequest.createdAt)}</span>
              </div>
              {returnRequest.creditNote ? (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Nota de crédito</span>
                    <span>{returnRequest.creditNote.accessKey.slice(0, 16)}</span>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {availableTransitions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Actualizar estado</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStatusUpdate} className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="status" className="text-sm font-medium">Estado</label>
                    <select
                      id="status"
                      name="status"
                      className="rounded-md border px-3 py-2 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccionar estado</option>
                      {availableTransitions.map((status) => (
                        <option key={status} value={status}>
                          {returnStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="notes" className="text-sm font-medium">Notas</label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="rounded-md border px-3 py-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Actualizando…' : 'Actualizar estado'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
