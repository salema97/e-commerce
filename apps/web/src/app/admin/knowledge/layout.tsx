import { KnowledgeSubNav } from '@/components/admin/knowledge-sub-nav';
import { requireKnowledgeAccess } from '@/lib/knowledge-page';

export default async function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireKnowledgeAccess('/admin/knowledge');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <KnowledgeSubNav />
      {children}
    </div>
  );
}
