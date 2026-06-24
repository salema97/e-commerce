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
  { href: '/admin/dashboard', label: 'Panel', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/products', label: 'Productos', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/categories', label: 'Categorías', icon: Tags, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/inventory', label: 'Inventario', icon: Warehouse, roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'] },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/returns', label: 'Devoluciones', icon: RotateCcw, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/customers', label: 'Clientes', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/support', label: 'Soporte', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
  { href: '/admin/invoices', label: 'Facturación', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  { href: '/admin/finance', label: 'Finanzas', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
];

interface AdminSidebarProps {
  role: Role;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const visibleNav = adminNav.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-24 flex-col items-center border-r-[4px] border-neo-onyx bg-neo-onyx py-8 lg:flex">
      <Link
        href="/admin/dashboard"
        className="mb-12 flex h-14 w-14 rotate-3 items-center justify-center border-[3px] border-white bg-neo-gold shadow-[4px_4px_0_white]"
        title="Administración"
      >
        <span className="font-anton text-3xl text-neo-onyx">NB</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-8">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="group relative"
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center border-[3px] shadow-[4px_4px_0_white] transition-colors',
                  active
                    ? 'border-white bg-neo-gold text-neo-onyx'
                    : 'border-white/20 bg-white/10 text-white hover:border-white hover:bg-white/20',
                )}
              >
                <Icon className="size-6" strokeWidth={2.5} />
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
