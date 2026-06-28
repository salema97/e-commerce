import { getServerApiClient } from '@/lib/api';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminCustomersTable } from '@/components/admin/admin-customers-table';

export default async function AdminCustomersPage() {
  const api = await getServerApiClient();
  const users = await api.users.findAll().catch(() => []);

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Clientes"
          subtitle="Cuentas y roles de usuario"
          showNetworkStatus={false}
        />
      }
    >
      <AdminCustomersTable users={users} />
    </AnimatedPageShell>
  );
}
