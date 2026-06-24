'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingBag,
  RotateCcw,
  Users,
  MessageSquare,
  BarChart3,
  FileText,
  TrendingUp,
  Star,
  Gift,
  Building2,
  FileSpreadsheet,
  Store,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@repo/shared-types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/analytics', label: 'Analítica', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  { href: '/admin/products', label: 'Products', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/categories', label: 'Categories', icon: Tags, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse, roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'] },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/customers', label: 'Customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/reviews', label: 'Reseñas', icon: Star, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/referrals', label: 'Referidos', icon: Gift, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  { href: '/admin/b2b', label: 'B2B', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/quotes', label: 'Cotizaciones', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  { href: '/admin/marketplace', label: 'Marketplace', icon: Store, roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'] },
  { href: '/admin/accounting', label: 'Contabilidad', icon: Calculator, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  { href: '/admin/support', label: 'Support', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
  { href: '/admin/invoices', label: 'Facturación', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  { href: '/admin/finance', label: 'Finance', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
];

interface AdminSidebarProps {
  role: Role;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleNav = adminNav.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/30">
      <div className="p-4 font-semibold">Admin Panel</div>
      <nav className="flex flex-col gap-1 px-3">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
