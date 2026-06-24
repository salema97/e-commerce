'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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

  return (
    <nav
      className="flex flex-wrap gap-2 border-b-[3px] border-neo-onyx pb-4"
      aria-label="Subsecciones"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'border-[3px] border-neo-onyx px-3 py-1.5 text-xs font-bold uppercase shadow-[3px_3px_0_#111] transition-colors',
              active ? 'bg-neo-gold' : 'bg-white hover:bg-neo-gold/50',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
