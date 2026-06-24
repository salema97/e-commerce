import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import type { User } from '@repo/shared-types';

interface AdminCustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  const { id } = await params;
  const api = await getServerApiClient();

  let user: User;
  try {
    user = await api.users.findOne(id);
  } catch {
    notFound();
  }

  return (
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={<h1 className="text-2xl font-bold">Detalles del cliente</h1>}
    >
      <NeoReveal>
        <Card>
        <CardHeader>
          <CardTitle>{user.email}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{user.phone ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rol</p>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registro</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('es-EC')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </NeoReveal>
    </AnimatedPageShell>
  );
}
