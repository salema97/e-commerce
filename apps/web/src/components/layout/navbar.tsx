'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ShoppingCart, Heart, Search, LogOut, User } from 'lucide-react';
import * as React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const storeLinks = [
  { href: '/store', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const navLinks = [
    ...storeLinks,
    ...(isAdmin ? [{ href: '/admin/dashboard', label: 'Admin' }] : []),
  ];

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 flex items-center gap-2 font-semibold">
          Store
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-foreground/80',
                pathname === link.href ? 'text-foreground' : 'text-foreground/60',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Link href="/store">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="size-4" />
            </Button>
          </Link>

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" aria-label="Wishlist">
              <Heart className="size-4" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" aria-label="Cart">
              <ShoppingCart className="size-4" />
            </Button>
          </Link>

          {!loading && user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/orders">
                <Button variant="ghost" size="sm">
                  <User className="mr-2 size-4" />
                  {user.name ?? user.email}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 size-4" />
                Salir
              </Button>
            </div>
          ) : !loading ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/sign-in" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Iniciar sesión
              </Link>
              <Link href="/sign-up" className={buttonVariants({ size: 'sm' })}>
                Registrarse
              </Link>
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="right">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-sm font-medium',
                  pathname === link.href ? 'text-foreground' : 'text-foreground/60',
                )}
              >
                {link.label}
              </Link>
            ))}
            {!loading && !user ? (
              <>
                <Link href="/sign-in" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
                  Iniciar sesión
                </Link>
                <Link href="/sign-up" className={buttonVariants({ className: 'w-full' })}>
                  Registrarse
                </Link>
              </>
            ) : null}
            {user ? (
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Salir
              </Button>
            ) : null}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
