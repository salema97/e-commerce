'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/lib/client-api';

interface FulfillmentsActionsProps {
  shipmentId: string;
  orderId: string;
}

export function FulfillmentsActions({ shipmentId, orderId }: FulfillmentsActionsProps) {
  const api = useApiClient();
  const router = useRouter();

  async function markDelivered() {
    await api.fulfillment.markDelivered(shipmentId);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/admin/orders/${orderId}`}>
        <Button variant="outline" size="sm" className="font-anton uppercase">
          Pedido
        </Button>
      </Link>
      <Button size="sm" className="font-anton uppercase" onClick={() => void markDelivered()}>
        Entregado
      </Button>
    </div>
  );
}
