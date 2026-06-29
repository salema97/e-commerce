'use client';

import { AdminSectionNav } from '@/components/admin/admin-section-nav';

const marketingLinks = [
  { href: '/admin/marketing', label: 'Campañas', exact: true },
  { href: '/admin/marketing/promotions', label: 'Promociones' },
  { href: '/admin/marketing/placements', label: 'Popups y banners' },
];

export function MarketingSubNav() {
  return <AdminSectionNav basePath="/admin/marketing" items={marketingLinks} />;
}
