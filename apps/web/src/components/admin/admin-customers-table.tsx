'use client';

import Link from 'next/link';
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
import { ClientPaginatedList } from '@/components/admin/client-paginated-list';
import type { User } from '@repo/shared-types';

export function AdminCustomersTable({ users }: { users: User[] }) {
  return (
    <ClientPaginatedList items={users}>
      {(pageUsers) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Correo electrónico</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.phone ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/customers/${user.id}`}>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ClientPaginatedList>
  );
}
