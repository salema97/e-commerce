import { redirect } from 'next/navigation';
import { getCurrentUser, adminRoles } from './auth';

export async function requireMarketingAccess(path: string) {
  const session = await getCurrentUser();

  if (!session || !adminRoles.includes(session.role)) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(path)}`);
  }

  return session;
}
