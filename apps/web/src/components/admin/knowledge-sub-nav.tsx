'use client';

import { AdminSectionNav } from '@/components/admin/admin-section-nav';

const knowledgeLinks = [
  { href: '/admin/knowledge', label: 'Resumen', exact: true },
  { href: '/admin/knowledge/faqs', label: 'Preguntas frecuentes' },
  { href: '/admin/knowledge/cms', label: 'Páginas CMS' },
];

export function KnowledgeSubNav() {
  return <AdminSectionNav basePath="/admin/knowledge" items={knowledgeLinks} />;
}
