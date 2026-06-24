'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, Store } from 'lucide-react';
import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { adminNavLabelForPath, filterAdminNav } from '@/lib/admin-nav';
import type { Role } from '@repo/shared-types';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Partial<Record<Role, string>> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  FINANCE: 'Finanzas',
  INVENTORY: 'Inventario',
  SUPPORT: 'Soporte',
};

interface AdminTopBarProps {
  role: Role;
}

export function AdminTopBar({ role }: AdminTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navItems = filterAdminNav(role);
  const sectionLabel = adminNavLabelForPath(pathname);

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-[3px] border-neo-onyx bg-neo-lace px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú de administración"
          >
            <Menu className="size-5" strokeWidth={2.5} />
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              Administración
            </p>
            <p className="font-anton text-xl uppercase leading-none md:text-2xl">{sectionLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/store"
            className="hidden items-center gap-2 border-[3px] border-neo-onyx bg-white px-3 py-2 text-xs font-bold uppercase shadow-[3px_3px_0_#111] transition-transform hover:-translate-y-0.5 sm:flex"
          >
            <Store className="size-4" strokeWidth={2.5} />
            Tienda
          </Link>
          <div className="hidden text-right sm:block">
            <p className="max-w-[180px] truncate text-xs font-bold">{user?.email ?? 'Usuario'}</p>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              {ROLE_LABELS[role] ?? role}
            </p>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={handleSignOut} aria-label="Cerrar sesión">
            <LogOut className="size-4" strokeWidth={2.5} />
          </Button>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100vw-2rem,320px)] border-[3px] border-neo-onyx bg-neo-lace p-0">
          <SheetHeader className="border-b-[3px] border-neo-onyx bg-neo-gold p-6 text-left">
            <SheetTitle className="font-anton text-3xl uppercase">Admin</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'border-[3px] border-neo-onyx px-4 py-3 text-sm font-bold uppercase shadow-[4px_4px_0_#111] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
                    active ? 'bg-neo-gold' : 'bg-white hover:bg-neo-gold/40',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/store"
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center gap-2 border-[3px] border-dashed border-neo-onyx px-4 py-3 text-sm font-bold uppercase"
            >
              <Store className="size-4" />
              Ir a la tienda
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
