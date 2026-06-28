'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  ShoppingCart,
  Heart,
  Search,
  LogOut,
  User,
  Bell,
  Store,
  Tags,
  LayoutDashboard,
} from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getStaffPanelNav, isStaffPanelPath } from '@/lib/admin-nav';
import { useCartStore } from '@/lib/cart-store';

const storeLinks = [
  { href: '/store', label: 'Tienda', icon: Store },
  { href: '/categories', label: 'Categorías', icon: Tags },
] as const;

function isNavLinkActive(pathname: string, href: string, label: string): boolean {
  if (label === 'Administración') {
    return isStaffPanelPath(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navChipClass(active: boolean, className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 border-[3px] border-neo-onyx px-4 py-2 text-sm font-bold uppercase shadow-[4px_4px_0_#111] transition-transform',
    'hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
    active ? 'bg-neo-gold' : 'bg-white hover:bg-neo-gold/40',
    className,
  );
}

function actionChipClass(className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 border-[3px] border-neo-onyx bg-white px-3 py-2 text-xs font-bold uppercase shadow-[3px_3px_0_#111] transition-transform',
    'hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-neo-gold/40',
    className,
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const cartCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const staffPanelNav = getStaffPanelNav(user?.role);
  const navLinks = [
    ...storeLinks,
    ...(staffPanelNav
      ? [{ href: staffPanelNav.href, label: staffPanelNav.label, icon: LayoutDashboard }]
      : []),
  ];

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-neo-onyx bg-neo-lace">
      <div className="flex h-20 items-center gap-3 px-4 md:gap-4 md:px-6">
        <Link
          href="/"
          className="flex flex-none items-center border-[3px] border-neo-onyx bg-neo-gold px-4 py-2 shadow-[4px_4px_0_#111] transition-transform hover:-translate-y-0.5 md:px-6"
        >
          <span className="font-anton text-2xl uppercase tracking-tighter md:text-3xl">NEO.STORE</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-3 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isNavLinkActive(pathname, link.href, link.label);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={navChipClass(active)}
              >
                <Icon className="size-4" strokeWidth={2.5} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-2 md:gap-3">
          <Link
            href="/wishlist"
            className={cn(actionChipClass('hidden md:inline-flex'), 'px-3')}
            aria-label="Lista de deseos"
          >
            <Heart className="size-4" strokeWidth={2.5} />
          </Link>

          <Link href="/cart" className={actionChipClass('bg-neo-lace')}>
            <ShoppingCart className="size-4 md:hidden" strokeWidth={2.5} />
            <span className="font-anton text-sm md:text-base">CARRITO ({cartCount})</span>
          </Link>

          <Link href="/store" className={actionChipClass('bg-neo-onyx text-white hover:bg-neo-scarlet hover:text-white')} aria-label="Buscar en tienda">
            <Search className="size-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Buscar</span>
          </Link>

          {!loading && user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/account/notifications"
                className={actionChipClass('px-3')}
                aria-label="Notificaciones"
              >
                <Bell className="size-4" strokeWidth={2.5} />
              </Link>
              <Link href="/account" className={actionChipClass()} aria-label="Mi cuenta">
                <User className="size-4" strokeWidth={2.5} />
                <span className="max-w-[120px] truncate">{user.name ?? user.email}</span>
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                className={cn(actionChipClass('h-auto rounded-none'), 'hover:bg-neo-gold')}
              >
                <LogOut className="size-4" strokeWidth={2.5} />
                Salir
              </Button>
            </div>
          ) : !loading ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/sign-in" className={navChipClass(false, 'px-4 py-2 text-xs')}>
                Entrar
              </Link>
              <Link href="/sign-up" className={navChipClass(false, 'bg-neo-gold px-4 py-2 text-xs')}>
                Registro
              </Link>
            </div>
          ) : null}

          <Button
            variant="outline"
            size="icon"
            className={cn(actionChipClass('h-10 w-10 p-0 lg:hidden'), 'rounded-none')}
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="border-l-[3px] border-neo-onyx bg-neo-lace">
          <SheetHeader className="border-b-[3px] border-neo-onyx bg-neo-gold p-6 text-left">
            <SheetTitle className="font-anton text-3xl uppercase">Menú</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-3 p-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isNavLinkActive(pathname, link.href, link.label);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={navChipClass(active, 'w-full justify-start')}
                >
                  <Icon className="size-4" strokeWidth={2.5} />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className={navChipClass(false, 'w-full justify-start')}
            >
              <Heart className="size-4" strokeWidth={2.5} />
              Lista de deseos
            </Link>
            {!loading && !user ? (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className={navChipClass(false, 'w-full justify-start')}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className={navChipClass(false, 'w-full justify-start bg-neo-gold')}
                >
                  Registrarse
                </Link>
              </>
            ) : null}
            {user ? (
              <>
                <Link
                  href="/account/notifications"
                  onClick={() => setMobileOpen(false)}
                  className={navChipClass(false, 'w-full justify-start')}
                >
                  <Bell className="size-4" strokeWidth={2.5} />
                  Notificaciones
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className={navChipClass(false, 'w-full justify-start')}
                >
                  <User className="size-4" strokeWidth={2.5} />
                  Mi cuenta
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className={navChipClass(false, 'w-full justify-start')}
                >
                  Mis pedidos
                </Link>
                <Button
                  variant="outline"
                  className={cn(navChipClass(false, 'w-full justify-start'), 'h-auto')}
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" strokeWidth={2.5} />
                  Salir
                </Button>
              </>
            ) : null}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
