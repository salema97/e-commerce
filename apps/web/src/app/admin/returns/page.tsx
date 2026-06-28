import { getServerApiClient } from '@/lib/api';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminReturnsTable } from '@/components/admin/admin-returns-table';

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
      <AdminReturnsTable returns={returns} />
    </AnimatedPageShell>
  );
}
