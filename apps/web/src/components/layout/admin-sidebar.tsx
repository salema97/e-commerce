'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m, useReducedMotion } from 'motion/react';
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
  BookOpen,
  Megaphone,
  Store,
  Wallet,
  Star,
  Gift,
  Building2,
  FileSpreadsheet,
  Calculator,
  MapPin,
  Repeat,
  UsersRound,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sidebarIconHover, sidebarIconRest } from '@/lib/neo-motion';
import { filterAdminNav } from '@/lib/admin-nav';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Role } from '@repo/shared-types';

const navIcons: Record<string, React.ElementType> = {
  '/admin/dashboard': LayoutDashboard,
  '/admin/products': Package,
  '/admin/categories': Tags,
  '/admin/inventory': Warehouse,
  '/admin/orders': ShoppingBag,
  '/admin/fulfillments': Truck,
  '/admin/returns': RotateCcw,
  '/admin/customers': Users,
  '/admin/reviews': Star,
  '/admin/referrals': Gift,
  '/admin/b2b': Building2,
  '/admin/quotes': FileSpreadsheet,
  '/admin/marketplace': Store,
  '/admin/pos': MapPin,
  '/admin/sellers': UsersRound,
  '/admin/subscriptions': Repeat,
  '/admin/accounting': Calculator,
  '/admin/marketing': Megaphone,
  '/admin/analytics': BarChart3,
  '/admin/support': MessageSquare,
  '/admin/knowledge': BookOpen,
  '/admin/invoices': FileText,
  '/admin/finance': Wallet,
};

interface AdminSidebarProps {
  role: Role;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const visibleNav = filterAdminNav(role);

  return (
    <TooltipProvider delayDuration={0}>
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-24 flex-col border-r-[4px] border-neo-onyx bg-neo-onyx lg:flex">
      <div className="flex flex-col items-center border-b-[3px] border-white/10 py-6">
        <Link
          href="/admin/dashboard"
          className="flex h-14 w-14 rotate-3 items-center justify-center border-[3px] border-white bg-neo-gold shadow-[4px_4px_0_white]"
          title="Panel de administración"
        >
          <span className="font-anton text-3xl text-neo-onyx">NB</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-3 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleNav.map((item, index) => {
          const Icon = navIcons[item.href];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const prevGroup = index > 0 ? visibleNav[index - 1]?.group : null;
          const showDivider = prevGroup && prevGroup !== item.group;

          return (
            <React.Fragment key={item.href}>
              {showDivider ? (
                <div className="h-[3px] w-10 bg-white/15" aria-hidden />
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={item.href} title={item.label} className="group relative">
                    <m.div
                      whileHover={prefersReducedMotion ? undefined : sidebarIconHover}
                      animate={prefersReducedMotion ? undefined : sidebarIconRest}
                      className={cn(
                        'flex h-14 w-14 items-center justify-center border-[3px] shadow-[4px_4px_0_white] transition-colors',
                        active
                          ? 'border-white bg-neo-gold text-neo-onyx'
                          : 'border-white/20 bg-white/10 text-white hover:border-white hover:bg-white/20',
                      )}
                    >
                      <Icon className="size-6" strokeWidth={2.5} />
                    </m.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-4 border-t-[3px] border-white/10 py-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/store" title="Volver a la tienda" className="group relative">
              <div className="flex h-12 w-12 items-center justify-center border-[3px] border-neo-gold text-neo-gold shadow-[3px_3px_0_var(--color-neo-gold)] transition-colors hover:bg-neo-gold hover:text-neo-onyx">
                <Store className="size-5" strokeWidth={2.5} />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-white">
            Tienda
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
    </TooltipProvider>
  );
}
