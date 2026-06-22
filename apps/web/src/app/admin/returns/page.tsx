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
  const api = getServerApiClient();
  const { status, customerEmail } = await searchParams;
  const returns = await api.returns.findAll({
    status,
    customerEmail,
    limit: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Returns</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((returnRequest) => (
              <TableRow key={returnRequest.id}>
                <TableCell className="font-medium">{returnRequest.id.slice(0, 8)}</TableCell>
                <TableCell>{returnRequest.order?.orderNumber.slice(0, 8) ?? '-'}</TableCell>
                <TableCell>{returnRequest.order?.customerEmail ?? 'Guest'}</TableCell>
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
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
