import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { StoreCreditCard } from '@/components/account/store-credit-card';
import type { StoreCreditBalance } from '@repo/shared-types';

const ACCOUNT_LINKS = [
  { href: '/orders', label: 'Mis pedidos' },
  { href: '/account/loyalty', label: 'Programa de lealtad' },
  { href: '/account/referrals', label: 'Invita y gana' },
  { href: '/account/quotes', label: 'Mis cotizaciones' },
  { href: '/account/subscriptions', label: 'Suscripciones' },
  { href: '/account/privacy', label: 'Privacidad y datos' },
  { href: '/account/notifications', label: 'Preferencias de notificaciones' },
  { href: '/help', label: 'Preguntas frecuentes' },
  { href: '/wishlist', label: 'Lista de deseos' },
] as const;

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account');
  }

  const api = await getServerApiClient();
  const initialBalance = await api.returns.myStoreCredit().catch(
    (): StoreCreditBalance | null => null,
  );

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-2xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Mi cuenta
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Cuenta</h1>
        </header>
      }
    >
      <div className="flex flex-col gap-6">
        <StoreCreditCard initialBalance={initialBalance} />

        <Card className="brutalist-card">
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ACCOUNT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}
              >
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AnimatedPageShell>
  );
}
