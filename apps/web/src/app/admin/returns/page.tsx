import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, returnStatusLabel, refundMethodLabel } from '@repo/shared-utils';

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; customerEmail?: string }>;
}) {
  const api = await getServerApiClient();
  const { status, customerEmail } = await searchParams;
  const returns = await api.returns.findAll({
    status,
    customerEmail,
    limit: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="neo-page-title">Devoluciones</h1>

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
                  <Link href={`/admin/returns/${returnRequest.id}`}>
                    <Button variant="outline" size="sm">Ver</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
