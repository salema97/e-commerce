import { redirect } from 'next/navigation';
import { getCurrentUser, knowledgeEditorRoles, knowledgeRoles } from './auth';

export async function requireKnowledgeAccess(path: string) {
  const session = await getCurrentUser();

  if (!session || !knowledgeRoles.includes(session.role)) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(path)}`);
  }

  return session;
}

export async function requireKnowledgeEditorAccess(path: string) {
  const session = await getCurrentUser();

  if (!session || !knowledgeEditorRoles.includes(session.role)) {
    redirect('/admin/knowledge');
  }

  return session;
}
