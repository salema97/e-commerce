'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClientPaginatedList } from '@/components/admin/client-paginated-list';
import { ReturnRowActions } from '@/components/admin/returns/return-row-actions';
import { formatDate, refundMethodLabel, returnStatusLabel } from '@repo/shared-utils';
import type { ReturnRequest } from '@repo/shared-types';

export function AdminReturnsTable({ returns }: { returns: ReturnRequest[] }) {
  return (
    <ClientPaginatedList items={returns}>
      {(pageReturns) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Devolución</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Resolución</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageReturns.map((returnRequest) => (
              <TableRow key={returnRequest.id}>
                <TableCell className="font-medium">{returnRequest.id.slice(0, 8)}</TableCell>
                <TableCell>{returnRequest.order?.orderNumber.slice(0, 8) ?? '-'}</TableCell>
                <TableCell>{returnRequest.order?.customerEmail ?? 'Invitado'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{returnStatusLabel(returnRequest.status)}</Badge>
                </TableCell>
                <TableCell>
                  {returnRequest.refundMethod
                    ? refundMethodLabel(returnRequest.refundMethod)
                    : '-'}
                </TableCell>
                <TableCell>{formatDate(returnRequest.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {returnRequest.orderId ? (
                    <ReturnRowActions
                      returnId={returnRequest.id}
                      orderId={returnRequest.orderId}
                      status={returnRequest.status}
                    />
                  ) : (
                    <Link
                      href={`/admin/returns/${returnRequest.id}`}
                      className="text-sm font-bold uppercase underline-offset-4 hover:underline"
                    >
                      Ver
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ClientPaginatedList>
  );
}
