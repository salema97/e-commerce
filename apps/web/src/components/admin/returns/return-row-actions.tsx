'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReturnStatus } from '@repo/shared-types';

interface ReturnRowActionsProps {
  returnId: string;
  orderId: string;
  status: ReturnStatus;
}

export function ReturnRowActions({ returnId, orderId, status }: ReturnRowActionsProps) {
  const canResolve = status === 'INSPECTION';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Acciones de devolución">
          <MoreHorizontal className="size-4" />
          Acciones
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/returns/${returnId}`}>Ver detalle</Link>
        </DropdownMenuItem>
        {canResolve ? (
          <DropdownMenuItem asChild>
            <Link href={`/admin/returns/${returnId}/resolve`}>Resolver</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/orders/${orderId}`}>Ver pedido</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
