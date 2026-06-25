import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { ReturnRowActions } from '@/components/admin/returns/return-row-actions';
import { formatDate, returnStatusLabel, refundMethodLabel } from '@repo/shared-utils';

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; customerEmail?: string }>;
}) {
  const [api, { status, customerEmail }] = await Promise.all([
    getServerApiClient(),
    searchParams,
  ]);
  const returns = await api.returns.findAll({
    status,
    customerEmail,
    limit: 50,
  });

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Devoluciones"
          subtitle="Solicitudes y reembolsos"
          showNetworkStatus={false}
        />
      }
    >
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
            {returns.map((returnRequest) => (
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
                    <Link href={`/admin/returns/${returnRequest.id}`} className="text-sm font-bold uppercase underline-offset-4 hover:underline">
                      Ver
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </AnimatedPageShell>
  );
}
