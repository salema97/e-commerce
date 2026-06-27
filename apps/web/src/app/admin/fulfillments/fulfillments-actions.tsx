'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { markShipmentDelivered } from './actions';

interface FulfillmentsActionsProps {
  shipmentId: string;
  orderId: string;
}

export function FulfillmentsActions({ shipmentId, orderId }: FulfillmentsActionsProps) {
  const [isPending, startTransition] = useTransition();

  function markDelivered() {
    startTransition(async () => {
      await markShipmentDelivered(shipmentId);
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/admin/orders/${orderId}`}>
        <Button variant="outline" size="sm" className="font-anton uppercase">
          Pedido
        </Button>
      </Link>
      <Button
        size="sm"
        className="font-anton uppercase"
        disabled={isPending}
        onClick={() => markDelivered()}
      >
        {isPending ? 'Guardando…' : 'Entregado'}
      </Button>
    </div>
  );
}
