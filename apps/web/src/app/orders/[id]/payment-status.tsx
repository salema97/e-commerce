'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { useApiClient } from '@/lib/client-api';
import { paymentStatusLabel } from '@repo/shared-utils';
import type { Payment, PaymentStatus } from '@repo/shared-types';

interface PaymentStatusProps {
  orderId: string;
  payments: Payment[] | undefined;
}

function statusVariant(status: PaymentStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'FAILED':
      return 'destructive';
    case 'REFUNDED':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function PaymentStatus({ orderId, payments }: PaymentStatusProps) {
  const api = useApiClient();
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  async function handleDownloadReceipt() {
    setIsGenerating(true);
    try {
      const receipt = await api.orders.getReceipt(orderId).catch(async () => {
        // Receipt does not exist yet; generate on demand.
        return api.orders.generateReceipt(orderId);
      });
      if (receipt?.url) {
        setReceiptUrl(receipt.url);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const primaryPayment = payments?.[0];

  return (
    <div className="flex flex-col gap-3">
      {primaryPayment ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pago</span>
          <Badge variant={statusVariant(primaryPayment.status)}>
            {paymentStatusLabel(primaryPayment.status)}
          </Badge>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no hay pago registrado.</p>
      )}

      <button
        type="button"
        onClick={handleDownloadReceipt}
        disabled={isGenerating}
        className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
      >
        {isGenerating ? 'Preparando recibo…' : 'Descargar recibo'}
      </button>
      {receiptUrl ? (
        <p className="text-xs text-muted-foreground">URL del recibo: {receiptUrl}</p>
      ) : null}
    </div>
  );
}
