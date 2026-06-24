import { redirect } from 'next/navigation';
import { getCurrentUser, supportRoles } from '@/lib/auth';
import { SupportInbox } from './support-inbox';

export default async function AdminSupportPage() {
  const session = await getCurrentUser();

  if (!session || !supportRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/support');
  }

  return <SupportInbox currentUserId={session.userId} />;
}
