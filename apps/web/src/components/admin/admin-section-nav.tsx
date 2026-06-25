'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface AdminSectionNavItem {
  href: string;
  label: string;
  exact?: boolean;
}

interface AdminSectionNavProps {
  basePath: string;
  items: AdminSectionNavItem[];
}

export function AdminSectionNav({ basePath, items }: AdminSectionNavProps) {
  const pathname = usePathname();

  if (!pathname.startsWith(basePath)) {
    return null;
  }

  const activeHref =
    items.find((item) =>
      item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href ?? items[0]?.href;

  return (
    <Tabs value={activeHref} className="w-full">
      <TabsList aria-label="Subsecciones">
        {items.map((item) => (
          <TabsTrigger key={item.href} value={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
