import { getServerApiClient } from '@/lib/api';
import { requireKnowledgeEditorAccess } from '@/lib/knowledge-page';
import { CmsView } from './cms-view';
import type { CmsPage } from '@repo/shared-types';

export default async function AdminKnowledgeCmsPage() {
  await requireKnowledgeEditorAccess('/admin/knowledge/cms');
  const api = await getServerApiClient();
  const initialPages = await api.ai.cmsPages.findAllAdmin().catch(() => [] as CmsPage[]);

  return <CmsView initialPages={initialPages} />;
}
