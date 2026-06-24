import { getServerApiClient } from '@/lib/api';
import { requireKnowledgeAccess } from '@/lib/knowledge-page';
import { knowledgeEditorRoles } from '@/lib/auth';
import { FaqsView } from './faqs-view';
import type { Faq } from '@repo/shared-types';

export default async function AdminKnowledgeFaqsPage() {
  const session = await requireKnowledgeAccess('/admin/knowledge/faqs');
  const api = await getServerApiClient();
  const initialFaqs = await api.ai.faqs.findAllAdmin().catch(() => [] as Faq[]);
  const canEdit = knowledgeEditorRoles.includes(session.role);

  return <FaqsView initialFaqs={initialFaqs} canEdit={canEdit} />;
}
