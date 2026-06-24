import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
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
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AdminSidebar role={session.role} />
      <div className="flex-1 overflow-auto p-4 lg:p-8">{children}</div>
    </div>
  );
}
