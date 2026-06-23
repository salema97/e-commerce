'use client';

import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '@repo/shared-types';

const statusVariant: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'default',
  AUTHORIZED: 'outline',
  REJECTED: 'destructive',
  FAILED: 'destructive',
};

const statusLabel: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  SUBMITTED: 'Enviada',
  AUTHORIZED: 'Autorizada',
  REJECTED: 'Rechazada',
  FAILED: 'Fallida',
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]}>
      {statusLabel[status]}
    </Badge>
  );
}
