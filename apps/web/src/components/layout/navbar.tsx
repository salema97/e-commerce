'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth,
} from '@clerk/nextjs';
import { Menu, ShoppingCart, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const storeLinks = [
  { href: '/store', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const navLinks = [
    ...storeLinks,
    ...(isAdmin ? [{ href: '/admin/dashboard', label: 'Admin' }] : []),
  ];

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

          {isSignedIn ? (
            <UserButton />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Sign up</Button>
              </SignUpButton>
            </div>
          )}

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
            {!isSignedIn ? (
              <React.Fragment>
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="w-full">Sign up</Button>
                </SignUpButton>
              </React.Fragment>
            ) : null}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
