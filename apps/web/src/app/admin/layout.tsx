import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminTopBar } from '@/components/layout/admin-top-bar';
import { adminOrSupportRoles, getCurrentUser } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentUser();

  if (!session || !adminOrSupportRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-neo-lace lg:pl-24">
      <AdminSidebar role={session.role} />
      <div className="flex min-h-screen flex-col">
        <AdminTopBar role={session.role} />
        <div className="flex flex-1 flex-col overflow-hidden p-4 lg:p-8 xl:p-10">{children}</div>
      </div>
    </div>
  );
}
