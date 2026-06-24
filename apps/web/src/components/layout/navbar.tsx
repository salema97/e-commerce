'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ShoppingCart, Heart, Search, LogOut, User, Bell } from 'lucide-react';
import * as React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getStaffPanelNav, isStaffPanelPath } from '@/lib/admin-nav';
import { useCartStore } from '@/lib/cart-store';

const storeLinks = [
  { href: '/store', label: 'Tienda' },
  { href: '/categories', label: 'Categorías' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const cartCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const staffPanelNav = getStaffPanelNav(user?.role);
  const navLinks = [...storeLinks, ...(staffPanelNav ? [staffPanelNav] : [])];

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-neo-lace brutalist-border-b">
      <div className="flex h-20 items-stretch">
        <Link
          href="/"
          className="flex flex-none items-center border-r-[3px] border-neo-onyx bg-neo-gold px-6 md:px-8"
        >
          <span className="font-anton text-3xl uppercase tracking-tighter md:text-4xl">NEO.STORE</span>
        </Link>

        <nav className="hidden flex-grow items-center gap-8 px-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-1 text-lg font-bold uppercase transition-colors hover:bg-neo-gold',
                pathname === link.href ||
                  pathname.startsWith(`${link.href}/`) ||
                  (link.label === 'Administración' && isStaffPanelPath(pathname))
                  ? 'bg-neo-gold'
                  : '',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-none items-stretch">
          <Link
            href="/wishlist"
            className="hidden items-center border-l-[3px] border-neo-onyx px-5 hover:bg-neo-gold md:flex"
            aria-label="Lista de deseos"
          >
            <Heart className="size-5" strokeWidth={3} />
          </Link>

          <Link
            href="/cart"
            className="flex items-center border-l-[3px] border-neo-onyx px-5 transition-colors hover:bg-neo-scarlet hover:text-white md:px-8"
          >
            <span className="font-anton text-lg md:text-xl">CARRITO ({cartCount})</span>
          </Link>

          <Link
            href="/store"
            className="flex items-center border-l-[3px] border-neo-onyx bg-neo-onyx px-5 text-white hover:bg-neo-scarlet md:px-8"
            aria-label="Buscar"
          >
            <Search className="size-6" strokeWidth={3} />
          </Link>

          {!loading && user ? (
            <div className="hidden items-stretch lg:flex">
              <Link
                href="/account/notifications"
                className="flex items-center border-l-[3px] border-neo-onyx px-4 hover:bg-neo-gold"
                aria-label="Notificaciones"
              >
                <Bell className="size-4" strokeWidth={3} />
              </Link>
              <Link
                href="/account"
                className="flex items-center border-l-[3px] border-neo-onyx px-4 hover:bg-neo-gold"
                aria-label="Mi cuenta"
              >
                <User className="mr-2 size-4" strokeWidth={3} />
                <span className="max-w-[120px] truncate text-sm font-bold uppercase">
                  {user.name ?? user.email}
                </span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSignOut}
                className="h-full rounded-none border-l-[3px] border-neo-onyx px-4 font-bold uppercase hover:bg-neo-gold"
              >
                <LogOut className="mr-2 size-4" strokeWidth={3} />
                Salir
              </Button>
            </div>
          ) : !loading ? (
            <div className="hidden items-stretch lg:flex">
              <Link
                href="/sign-in"
                className="flex items-center border-l-[3px] border-neo-onyx px-5 font-bold uppercase hover:bg-neo-gold"
              >
                Entrar
              </Link>
              <Link
                href="/sign-up"
                className="flex items-center border-l-[3px] border-neo-onyx bg-neo-gold px-5 font-bold uppercase hover:bg-white"
              >
                Registro
              </Link>
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="h-full rounded-none border-l-[3px] border-neo-onyx lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" strokeWidth={3} />
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="border-l-[3px] border-neo-onyx bg-neo-lace">
          <SheetHeader>
            <SheetTitle className="font-anton text-3xl uppercase">Menú</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-[3px] border-neo-onyx bg-white px-4 py-3 text-sm font-bold uppercase shadow-[4px_4px_0_0_#111]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              Lista de deseos
            </Link>
            {!loading && !user ? (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ className: 'w-full' })}
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
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  Notificaciones
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  Mi cuenta
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  Mis pedidos
                </Link>
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
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
