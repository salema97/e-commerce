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
import type { User } from '@repo/shared-types';

export default async function AdminCustomersPage() {
  const api = await getServerApiClient();
  const users = await api.users.findAll().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="neo-page-title">Clientes</h1>

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
            {users.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.phone ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/customers/${user.id}`}>
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
