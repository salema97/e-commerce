import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCurrentRole, getCurrentUser, supportRoles } from '@/lib/auth';
import { getTestAuthSession } from '@/lib/test-auth';
import { SupportInbox } from './support-inbox';

export default async function AdminSupportPage() {
  const { userId } = await auth();
  const role = await getCurrentRole();
  const testSession = await getTestAuthSession();
  const effectiveRole = role ?? testSession?.role;
  const effectiveUserId = userId ?? testSession?.userId;

  if (!effectiveUserId || !effectiveRole || !supportRoles.includes(effectiveRole)) {
    redirect('/sign-in?redirect_url=/admin/support');
  }

  return <SupportInbox currentUserId={effectiveUserId} />;
}
