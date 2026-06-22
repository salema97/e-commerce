import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { adminRoles, getCurrentRole } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const role = await getCurrentRole();

  if (!userId || !role || !adminRoles.includes(role)) {
    redirect('/sign-in?redirect_url=/admin/dashboard');
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 lg:p-8">{children}</div>
    </div>
  );
}
