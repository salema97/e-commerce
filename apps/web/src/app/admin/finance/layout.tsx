import { redirect } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';
import { FinanceSubNav } from '@/components/admin/finance-sub-nav';

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/finance');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <FinanceSubNav />
      {children}
    </div>
  );
}
