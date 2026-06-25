import { redirect } from 'next/navigation';
import { getCurrentUser, financeRoles } from './auth';

export async function requireFinanceAccess(path: string) {
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(path)}`);
  }

  return session;
}

export function defaultFinanceMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
