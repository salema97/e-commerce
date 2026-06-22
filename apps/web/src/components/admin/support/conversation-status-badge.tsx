'use client';

import { Badge } from '@/components/ui/badge';
import type { ConversationStatus } from '@repo/shared-types';

const statusVariant: Record<ConversationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'default',
  PENDING: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'destructive',
};

const statusLabel: Record<ConversationStatus, string> = {
  OPEN: 'Abierto',
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

interface ConversationStatusBadgeProps {
  status: ConversationStatus;
}

export function ConversationStatusBadge({ status }: ConversationStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]}>
      {statusLabel[status]}
    </Badge>
  );
}
