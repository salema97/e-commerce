import { redirect } from 'next/navigation';
import { getCurrentUser, supportRoles } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { SupportInbox } from './support-inbox';
import type { PaginatedConversations } from '@repo/shared-types';

const EMPTY_CONVERSATIONS: PaginatedConversations = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

export default async function AdminSupportPage() {
  const session = await getCurrentUser();

  if (!session || !supportRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/support');
  }

  const api = await getServerApiClient();
  let initialConversations = EMPTY_CONVERSATIONS;

  try {
    initialConversations = await api.conversations.findAll({ limit: 50 });
  } catch {
    initialConversations = EMPTY_CONVERSATIONS;
  }

  return (
    <SupportInbox
      currentUserId={session.userId}
      initialConversations={initialConversations}
    />
  );
}
