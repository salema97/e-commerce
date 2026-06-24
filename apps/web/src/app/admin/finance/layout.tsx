import { redirect } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/finance');
  }

  return children;
}
